/**
 * Liga microfone, parser e fila pendente.
 *
 * É o único ponto que os dois jogos consomem — Cacheta e Fodinha diferem apenas no
 * `game` e no que fazem em `onApply`.
 *
 * Regra que não muda: nada chega ao placar sem aprovação, e reconhecer nunca para para
 * esperar o usuário decidir.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseCommand } from './parseCommand';
import {
  emptyPending,
  ingest,
  pendingCount,
  pruneExpired,
  removeEntry,
  removeUnresolved,
  resolveUnresolved,
  type PendingState,
} from './pendingQueue';
import type { FodinhaPhase, RosterPlayer, VoiceGame, VoiceLocale } from './types';
import { useSpeechSession, type VoiceMode } from './useSpeechSession';
import { normalizeToken } from './normalize';

interface UseVoiceScoringOptions {
  game: VoiceGame;
  /**
   * Idioma da gramática e do reconhecedor. Fixado na montagem da tela, junto com o resto
   * da UI de voz — trocar o idioma no meio de uma partida não é um caso que exista.
   */
  locale: VoiceLocale;
  players: RosterPlayer[];
  phase?: FodinhaPhase;
  cardsInRound?: number;
  /**
   * Valor já no placar por jogador, para a fase corrente (Fodinha).
   *
   * Sem isto "matheus fez" não teria de onde partir para somar mais uma vaza.
   */
  baseline?: Record<string, number>;
  /**
   * Aplica a fila ao placar. Devolve `true` quando o lote foi aplicado — só nesse caso a
   * fila é limpa. Aplicar sem fechar a rodada conta como sucesso: um lote parcial no meio
   * da mão é uso normal. Em caso de erro de validação a fila fica, para o usuário corrigir
   * um item e aprovar de novo (aplicar é idempotente).
   */
  onApply: (pending: PendingState, advance: boolean) => boolean;
  onError?: (code: string, message: string) => void;
}

export const useVoiceScoring = ({
  game,
  locale,
  players,
  phase,
  cardsInRound,
  baseline,
  onApply,
  onError,
}: UseVoiceScoringOptions) => {
  const [mode, setMode] = useState<VoiceMode>('idle');
  const [pending, setPending] = useState<PendingState>(emptyPending);
  /**
   * Aberto/fechado do painel mora aqui, e não no componente, porque o painel é
   * renderizado na raiz da tela — fora do rodapé. No Android um filho desenhado fora dos
   * limites do pai não recebe toque, então a pastilha e o painel não podem ser irmãos.
   *
   * Começa **aberto**: ligar a voz já é a escolha de usar a fila, então escondê-la por
   * padrão só adicionava um toque. Recolher continua disponível, e a escolha persiste.
   */
  const [panelOpen, setPanelOpen] = useState(true);
  /**
   * Apelidos aprendidos por toque, válidos só nesta sessão. Deliberadamente efêmero:
   * um palpite de ontem não deve reaparecer como certeza hoje.
   */
  const [aliases, setAliases] = useState<Record<string, string>>({});

  const aliasesRef = useRef(aliases);
  aliasesRef.current = aliases;

  /**
   * Espelho do estado da fila. Um comando de voz que aplica ("próxima rodada") precisa
   * do estado *depois* de incorporar a mesma fala, e o `pending` do closure ainda é o
   * anterior neste tick.
   */
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  // As telas passam `onApply` inline, então a identidade muda a cada render.
  const applyRef = useRef(onApply);
  applyRef.current = onApply;

  const contextRef = useRef({ game, locale, players, phase, cardsInRound, baseline });
  contextRef.current = { game, locale, players, phase, cardsInRound, baseline };

  // Contador monotônico: `Date.now()` colide quando uma fala gera vários itens.
  const idCounter = useRef(0);
  const nextId = useCallback(() => {
    idCounter.current += 1;
    return `unresolved-${String(idCounter.current)}`;
  }, []);

  /** Nomes da mesa, para enviesar o reconhecedor antes de ele errar. */
  const contextualStrings = useMemo(
    () => players.map((player) => player.name).filter((name) => name.trim().length > 0),
    [players],
  );

  const handleTranscript = useCallback(
    (transcript: string) => {
      const current = contextRef.current;
      const commands = parseCommand(transcript, {
        game: current.game,
        locale: current.locale,
        players: current.players,
        aliases: aliasesRef.current,
        phase: current.phase,
        cardsInRound: current.cardsInRound,
      });
      if (commands.length === 0) return;

      const result = ingest(pendingRef.current, commands, {
        nextId,
        baseline: current.baseline,
        maxValue: current.cardsInRound,
      });

      if (result.undo) {
        pendingRef.current = emptyPending();
        setPending(emptyPending());
        return;
      }

      pendingRef.current = result.state;
      setPending(result.state);

      // "próxima rodada" dito na mesma fala é uma aprovação explícita: aplica o lote
      // inteiro, incluindo o que acabou de ser reconhecido nesta frase.
      if (result.advance && applyRef.current(result.state, true)) {
        pendingRef.current = emptyPending();
        setPending(emptyPending());
      }
    },
    [nextId],
  );

  /**
   * Varre as perguntas de nome vencidas.
   *
   * Só roda enquanto há alguma na tela, e `pruneExpired` devolve o mesmo objeto quando
   * nada mudou — então o intervalo não provoca render sem motivo.
   */
  useEffect(() => {
    if (pending.unresolved.length === 0) return;

    const timer = setInterval(() => {
      const next = pruneExpired(pendingRef.current, Date.now());
      if (next !== pendingRef.current) {
        pendingRef.current = next;
        setPending(next);
      }
    }, 250);

    return () => {
      clearInterval(timer);
    };
  }, [pending.unresolved.length]);

  const session = useSpeechSession({
    mode,
    locale,
    contextualStrings,
    onFinalTranscript: handleTranscript,
    onError,
  });

  // --- Ações da UI ---

  const startPushToTalk = useCallback(async () => {
    setMode('ptt');
    const started = await session.start();
    if (!started) setMode('idle');
  }, [session]);

  const stopPushToTalk = useCallback(() => {
    session.stop();
    setMode('idle');
  }, [session]);

  const startContinuous = useCallback(async () => {
    setMode('continuous');
    const started = await session.start();
    if (!started) setMode('idle');
  }, [session]);

  const stopContinuous = useCallback(() => {
    session.stop();
    setMode('idle');
  }, [session]);

  const apply = useCallback(() => {
    const advanced = onApply(pending, true);
    if (advanced) {
      pendingRef.current = emptyPending();
      setPending(emptyPending());
    }
  }, [onApply, pending]);

  const clear = useCallback(() => {
    pendingRef.current = emptyPending();
    setPending(emptyPending());
  }, []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  /** Toque numa linha não reconhecida: resolve e memoriza o apelido para a sessão. */
  const assignUnresolved = useCallback(
    (unresolvedId: string, playerId: string) => {
      setPending((previous) => {
        const target = previous.unresolved.find((item) => item.id === unresolvedId);
        if (target !== undefined) {
          // Mesma normalização que o parser usará ao procurar este apelido depois.
          const key = normalizeToken(target.token, locale);
          if (key.length > 0) setAliases((prev) => ({ ...prev, [key]: playerId }));
        }
        return resolveUnresolved(previous, unresolvedId, playerId);
      });
    },
    [locale],
  );

  const dismissEntry = useCallback((playerId: string) => {
    setPending((previous) => removeEntry(previous, playerId));
  }, []);

  const dismissUnresolved = useCallback((unresolvedId: string) => {
    setPending((previous) => removeUnresolved(previous, unresolvedId));
  }, []);

  return {
    mode,
    isListening: session.isListening,
    volume: session.volume,
    interim: session.interim,
    permission: session.permission,
    pending,
    count: pendingCount(pending),
    panelOpen,
    openPanel,
    closePanel,
    startPushToTalk,
    stopPushToTalk,
    startContinuous,
    stopContinuous,
    apply,
    clear,
    assignUnresolved,
    dismissEntry,
    dismissUnresolved,
  };
};
