/**
 * Tipos do reconhecimento de voz.
 *
 * Este módulo é deliberadamente independente dos hooks de jogo: nada aqui importa
 * AsyncStorage, i18n ou React. Isso mantém o parser puro e testável sem mocks.
 * `VoiceAction` é compatível com `CachetaAction`, mas sem o `null`.
 */

/**
 * Idiomas em que a voz funciona. São tags BCP-47 porque o mesmo valor é entregue ao
 * reconhecedor nativo — `AppLocale` ('en') e este ('en-US') são coisas diferentes de
 * propósito, e a conversão acontece na borda da UI.
 */
export type VoiceLocale = 'pt-BR' | 'en-US';

export type VoiceAction = 'won' | 'fold' | 'lost';

export type VoiceGame = 'cacheta' | 'fodinha';

export type FodinhaPhase = 'betting' | 'results';

/**
 * Como o número falado deve ser aplicado.
 *
 * `set` é o caso normal ("fez duas"). `add` existe porque na fase de resultado as vazas
 * são anunciadas uma a uma, enquanto a mão é jogada: "matheus fez" sem número significa
 * mais uma, não "uma".
 */
export type FodinhaValueMode = 'set' | 'add';

export interface RosterPlayer {
  id: string;
  name: string;
}

/** Jogador com a forma normalizada pré-calculada, para não normalizar a cada token. */
export interface RosterEntry extends RosterPlayer {
  normalized: string;
  /** Posição na mesa (1-based), usada pelo fallback "jogador um". */
  position: number;
}

/** O que o parser entendeu, antes de virar uma alteração de placar. */
export type VoiceCommand =
  | { kind: 'cacheta.action'; playerId: string; action: VoiceAction; confidence: number }
  | {
      kind: 'fodinha.value';
      playerId: string;
      amount: number;
      mode: FodinhaValueMode;
      confidence: number;
    }
  | { kind: 'unresolved'; token: string; candidates: string[]; intent: UnresolvedIntent }
  | { kind: 'advance' }
  | { kind: 'undo' }
  | { kind: 'unparsed'; raw: string };

/**
 * O verbo foi entendido mas nenhum nome bateu com confiança suficiente.
 * Guardamos a intenção para que um toque do usuário complete o comando.
 */
export type UnresolvedIntent =
  | { game: 'cacheta'; action: VoiceAction }
  | { game: 'fodinha'; amount: number; mode: FodinhaValueMode };

export interface ParseContext {
  game: VoiceGame;
  /** Gramática e normalização a usar. Sem padrão: o idioma errado erra em silêncio. */
  locale: VoiceLocale;
  players: RosterPlayer[];
  /** Apelidos aprendidos na sessão: token normalizado -> id do jogador. */
  aliases?: Record<string, string>;
  /** Só usado em Fodinha, para limitar os valores falados. */
  phase?: FodinhaPhase;
  cardsInRound?: number;
}
