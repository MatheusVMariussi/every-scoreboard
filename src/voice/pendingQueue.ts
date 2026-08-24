/**
 * Fila de alterações pendentes.
 *
 * Duas regras definem o comportamento:
 *
 * 1. **Uma linha por jogador, não por fala.** Falar de novo sobre a mesma pessoa
 *    substitui a entrada anterior e marca como corrigida. Isso faz a fila se curar
 *    sozinha quando alguém repete depois de o reconhecedor errar.
 * 2. **Nada é aplicado sem aprovação.** Reconhecer nunca para para esperar — a fila
 *    continua enchendo enquanto o usuário decide.
 *
 * A lógica fica aqui como funções puras; o hook só embrulha em estado.
 */

import type { VoiceAction, VoiceCommand } from './types';

/** Valor pendente: ação (Cacheta) ou número (Fodinha). */
export type PendingValue =
  | { game: 'cacheta'; action: VoiceAction }
  | { game: 'fodinha'; value: number };

export interface PendingEntry {
  playerId: string;
  value: PendingValue;
  /** Nota do casamento de nome. Abaixo de `ACCEPT_SCORE` a UI destaca a linha. */
  confidence: number;
  /** `true` quando esta entrada substituiu uma anterior do mesmo jogador. */
  wasCorrected: boolean;
}

/**
 * Quanto tempo uma pergunta de nome fica na tela antes de sumir sozinha.
 *
 * Uma linha "quem foi?" que ninguém responde é ruído acumulando no painel — pior no modo
 * sempre ouvindo, onde a fala solta é constante. Ela pede atenção por alguns segundos e
 * depois se retira.
 */
export const UNRESOLVED_TTL_MS = 5000;

/** Verbo entendido, nome não. Vira uma linha tocável que ensina um apelido. */
export interface UnresolvedEntry {
  /** Identidade estável para key de lista e remoção. */
  id: string;
  token: string;
  candidates: string[];
  value: PendingValue;
  /** Instante em que a linha se auto-remove se ninguém escolher. */
  expiresAt: number;
}

export interface PendingState {
  /** Chaveado por playerId — é isto que dá a semântica de substituição. */
  entries: Record<string, PendingEntry>;
  unresolved: UnresolvedEntry[];
}

export const emptyPending = (): PendingState => ({ entries: {}, unresolved: [] });

export const isPendingEmpty = (state: PendingState): boolean =>
  Object.keys(state.entries).length === 0 && state.unresolved.length === 0;

/** Total de itens que pedem atenção do usuário. */
export const pendingCount = (state: PendingState): number =>
  Object.keys(state.entries).length + state.unresolved.length;

/** Contexto que a fila precisa para resolver "+1" num valor absoluto. */
export interface IngestOptions {
  /** Contador monotônico para ids estáveis, já que `Date.now()` colide em lote. */
  nextId: () => string;
  /** Injetado para os testes poderem fixar o relógio. */
  now?: number;
  /**
   * Valor que cada jogador já tem no placar, para a fase corrente.
   *
   * Necessário porque "matheus fez" é um incremento: sem saber de onde partir, dois
   * anúncios seguidos dariam o mesmo resultado em vez de somar.
   */
  baseline?: Record<string, number>;
  /** Teto para os valores de Fodinha — normalmente `cardsInRound`. */
  maxValue?: number;
}

/**
 * Converte um comando em valor pendente.
 *
 * Um incremento parte do que já está pendente para aquele jogador; só quando não há nada
 * pendente é que cai no placar. É isso que faz "matheus fez, matheus fez" virar 2.
 */
const toPendingValue = (
  command: VoiceCommand,
  current: PendingEntry | undefined,
  options: IngestOptions,
): PendingValue | null => {
  if (command.kind === 'cacheta.action') return { game: 'cacheta', action: command.action };

  const fodinha =
    command.kind === 'fodinha.value'
      ? { amount: command.amount, mode: command.mode }
      : command.kind === 'unresolved' && command.intent.game === 'fodinha'
        ? { amount: command.intent.amount, mode: command.intent.mode }
        : null;

  if (fodinha !== null) {
    if (fodinha.mode === 'set') return { game: 'fodinha', value: fodinha.amount };

    const pending = current?.value.game === 'fodinha' ? current.value.value : undefined;
    const playerId = command.kind === 'fodinha.value' ? command.playerId : '';
    const start = pending ?? options.baseline?.[playerId] ?? 0;
    const raised = start + fodinha.amount;
    const capped = options.maxValue === undefined ? raised : Math.min(options.maxValue, raised);
    return { game: 'fodinha', value: Math.max(0, capped) };
  }

  if (command.kind === 'unresolved' && command.intent.game === 'cacheta') {
    return { game: 'cacheta', action: command.intent.action };
  }
  return null;
};

/**
 * Incorpora os comandos de uma fala na fila.
 *
 * `advance` e `undo` não entram na fila — são sinais de controle, devolvidos separados
 * para quem chama decidir o que fazer.
 */
export const ingest = (
  state: PendingState,
  commands: readonly VoiceCommand[],
  options: IngestOptions,
): { state: PendingState; advance: boolean; undo: boolean } => {
  const now = options.now ?? Date.now();
  let entries = { ...state.entries };
  let unresolved = [...state.unresolved];
  let advance = false;
  let undo = false;

  commands.forEach((command) => {
    if (command.kind === 'advance') {
      advance = true;
      return;
    }
    if (command.kind === 'undo') {
      undo = true;
      return;
    }
    // Fala que não virou nada é descartada de propósito: a fila é para o que dá para
    // aprovar. Listar "não entendi" só enchia o painel de ruído que ninguém pode acionar.
    if (command.kind === 'unparsed') return;
    if (command.kind === 'unresolved') {
      const value = toPendingValue(command, undefined, options);
      if (value === null) return;
      unresolved = [
        ...unresolved,
        {
          id: options.nextId(),
          token: command.token,
          candidates: command.candidates,
          value,
          expiresAt: now + UNRESOLVED_TTL_MS,
        },
      ];
      return;
    }

    const value = toPendingValue(command, entries[command.playerId], options);
    if (value === null) return;
    entries = {
      ...entries,
      [command.playerId]: {
        playerId: command.playerId,
        value,
        confidence: command.confidence,
        // Substituir o que já estava lá é o comportamento, não um erro — mas o usuário
        // precisa ver que houve troca.
        wasCorrected: entries[command.playerId] !== undefined,
      },
    };
  });

  return { state: { entries, unresolved }, advance, undo };
};

/** Resolve uma linha pendente atribuindo-a a um jogador (o toque do usuário). */
export const resolveUnresolved = (
  state: PendingState,
  unresolvedId: string,
  playerId: string,
): PendingState => {
  const target = state.unresolved.find((item) => item.id === unresolvedId);
  if (target === undefined) return state;

  return {
    ...state,
    entries: {
      ...state.entries,
      [playerId]: {
        playerId,
        value: target.value,
        // Escolha explícita do usuário: confiança total.
        confidence: 1,
        wasCorrected: state.entries[playerId] !== undefined,
      },
    },
    unresolved: state.unresolved.filter((item) => item.id !== unresolvedId),
  };
};

export const removeEntry = (state: PendingState, playerId: string): PendingState => {
  const entries = { ...state.entries };
  delete entries[playerId];
  return { ...state, entries };
};

export const removeUnresolved = (state: PendingState, unresolvedId: string): PendingState => ({
  ...state,
  unresolved: state.unresolved.filter((item) => item.id !== unresolvedId),
});

/**
 * Retira as perguntas que passaram do prazo.
 *
 * Devolve o mesmo objeto quando nada expirou, para não disparar render à toa — isto roda
 * num intervalo enquanto houver perguntas na tela.
 */
export const pruneExpired = (state: PendingState, now: number = Date.now()): PendingState => {
  const kept = state.unresolved.filter((item) => item.expiresAt > now);
  if (kept.length === state.unresolved.length) return state;
  return { ...state, unresolved: kept };
};

/** Converte a fila em lote para `applyVoiceBatch` de Cacheta. */
export const toCachetaBatch = (state: PendingState): { playerId: string; action: VoiceAction }[] =>
  Object.values(state.entries)
    .filter((entry) => entry.value.game === 'cacheta')
    .map((entry) => ({
      playerId: entry.playerId,
      action: (entry.value as { game: 'cacheta'; action: VoiceAction }).action,
    }));

/** Converte a fila em lote para `applyVoiceBatch` de Fodinha. */
export const toFodinhaBatch = (state: PendingState): { playerId: string; value: number }[] =>
  Object.values(state.entries)
    .filter((entry) => entry.value.game === 'fodinha')
    .map((entry) => ({
      playerId: entry.playerId,
      value: (entry.value as { game: 'fodinha'; value: number }).value,
    }));
