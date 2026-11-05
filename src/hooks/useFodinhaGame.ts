import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { getData, STORAGE_KEYS } from '../utils/storage';
import { intInRange, isNonNegativeNumber, isRecord, oneOf } from '../utils/parse';
import { translate } from '../i18n';
import { useAutoSave } from './useAutoSave';

export type RoundPhase = 'betting' | 'results';
export type PenaltyMode = 'fixed' | 'difference';
/** Sentido do próximo passo no número de cartas: sobe até o limite, desce até 1. */
export type CardsDirection = 'up' | 'down';

export interface FodinhaPlayer {
  id: string;
  name: string;
  lives: number;
  /**
   * Dano de cada rodada, com uma posição por rodada para todos os jogadores — o índice é
   * o número da rodada. `null` marca a rodada que o jogador não jogou: já estava
   * eliminado ou ainda não estava na mesa.
   */
  history: (number | null)[];
  currentBid: number;
  currentWon: number;
  /**
   * Vidas somadas (ou tiradas) à mão pelo modal do jogador, por cima da conta do
   * histórico. Ausente = 0. Ver `logicSetLives`.
   */
  livesAdjustment?: number;
}
type Player = FodinhaPlayer;

export interface FodinhaRound {
  id: string;
  index: number;
}

export type FodinhaOutcome =
  | { status: 'playing' }
  | { status: 'won'; winner: FodinhaPlayer }
  | { status: 'tie'; players: FodinhaPlayer[] };

/** Baralho de truco: sem 8, 9, 10 e coringas. */
export const CARDS_PER_DECK = 40;
/** A vira sai do mesmo baralho e não vai para a mão de ninguém. */
export const VIRA_CARDS = 1;
export const MIN_DECKS = 1;
export const MAX_DECKS = 4;
export const MIN_LIVES = 1;
export const MAX_LIVES = 50;
const DEFAULT_LIVES = 7;
/** Teto de sanidade para valores lidos do disco: nenhuma mão passa de todos os baralhos. */
const MAX_CARDS_SANITY = CARDS_PER_DECK * MAX_DECKS;
/** Teto de sanidade para a correção manual lida do disco. */
const MAX_LIVES_ADJUSTMENT_SANITY = 10_000;

const ROUND_PHASES: readonly RoundPhase[] = ['betting', 'results'];
const PENALTY_MODES: readonly PenaltyMode[] = ['fixed', 'difference'];
const CARDS_DIRECTIONS: readonly CardsDirection[] = ['up', 'down'];

// --- Lógica pura ---

export const isAlive = (player: Player): boolean => player.lives > 0;

export const countAlive = (players: readonly Player[]): number => players.filter(isAlive).length;

/**
 * Ordem de exibição da mesa: quem está vivo em cima, eliminados embaixo, cada grupo na
 * ordem das cadeiras. É só para a tela: a lista guardada não muda, então ao reiniciar o
 * jogo (todos com vidas de novo) cada um volta para a sua cadeira.
 */
export const orderForTable = <T extends Player>(players: readonly T[]): T[] => [
  ...players.filter(isAlive),
  ...players.filter((p) => !isAlive(p)),
];

/** Soma apostas ou vazas só de quem ainda está no jogo. */
export const sumLiving = (players: readonly Player[], field: 'currentBid' | 'currentWon'): number =>
  players.reduce((acc, p) => (isAlive(p) ? acc + p[field] : acc), 0);

/** Rodadas jogadas. Usa o maior histórico: saves antigos paravam o dos eliminados. */
export const getRoundCount = (players: readonly Player[]): number =>
  players.reduce((max, p) => Math.max(max, p.history.length), 0);

/** Vidas perdidas numa rodada. Acertar a aposta não custa nada. */
export const getRoundDamage = (bid: number, won: number, penaltyMode: PenaltyMode): number => {
  const diff = Math.abs(bid - won);
  if (diff === 0) return 0;
  return penaltyMode === 'fixed' ? 1 : diff;
};

/** Dano somado do histórico; rodada não jogada (`null`) não conta. */
const sumDamage = (history: readonly (number | null)[]): number =>
  history.reduce<number>((acc, damage) => acc + (damage ?? 0), 0);

/** Vidas pela conta do histórico, com a correção manual do jogador (`livesAdjustment`). */
export const computeLives = (
  initialLives: number,
  history: readonly (number | null)[],
  adjustment = 0,
): number => Math.max(0, initialLives + adjustment - sumDamage(history));

/**
 * Vidas corrigidas à mão pelo modal do jogador: um engano no placar, ou uma regra da casa.
 *
 * A correção é guardada como ajuste sobre a conta do histórico, não como um número solto:
 * editar ou apagar uma rodada depois recalcula as vidas a partir do histórico, e o ajuste
 * continua valendo em cima dele. O ajuste entra antes do piso de 0, senão quem voltasse
 * ao jogo depois de cair com folga não perderia mais vidas.
 */
export const logicSetLives = (
  players: Player[],
  pId: string,
  lives: number,
  initialLives: number,
): Player[] =>
  players.map((p) => {
    if (p.id !== pId) return p;
    const target = Math.max(0, Math.min(MAX_LIVES, Math.round(lives)));
    if (target === p.lives) return p;
    return {
      ...p,
      lives: target,
      livesAdjustment: target - (initialLives - sumDamage(p.history)),
    };
  });

/** Partida nova: mesmas cadeiras e nomes, vidas cheias, sem histórico nem correções. */
export const logicResetPlayers = (players: readonly Player[], initialLives: number): Player[] =>
  players.map((p) => ({
    id: p.id,
    name: p.name,
    lives: initialLives,
    history: [],
    currentBid: 0,
    currentWon: 0,
  }));

/**
 * Máximo de cartas por jogador numa rodada: o baralho, menos a vira, dividido igualmente
 * entre os vivos. Com 1 baralho: 3 jogadores = 13, 4 = 9, 5 = 7.
 */
export const getMaxCards = (deckCount: number, alivePlayers: number): number =>
  Math.max(1, Math.floor((deckCount * CARDS_PER_DECK - VIRA_CARDS) / Math.max(1, alivePlayers)));

/**
 * Cartas da próxima rodada: sobe de 1 em 1 até o limite, desce até 1 e volta a subir, sem
 * repetir os extremos (…8, 9, 8… 2, 1, 2…).
 *
 * `direction` é o sentido do PRÓXIMO passo, não do último. Por isso basta corrigir o
 * número de cartas à mão para a sequência seguir do ponto certo.
 */
export const getNextRoundCards = (
  current: number,
  direction: CardsDirection,
  max: number,
): { cards: number; direction: CardsDirection } => {
  if (max <= 1) return { cards: 1, direction: 'up' };

  // Acima do limite só por save antigo ou mesa que cresceu: volta para dentro dele.
  const from = Math.min(Math.max(1, current), max);

  if (direction === 'up') {
    return from < max
      ? { cards: from + 1, direction: 'up' }
      : { cards: max - 1, direction: 'down' };
  }
  return from > 1 ? { cards: from - 1, direction: 'down' } : { cards: 2, direction: 'up' };
};

/**
 * Desfaz um passo de `getNextRoundCards`: quantas cartas teve a rodada anterior.
 *
 * Subindo, a anterior tinha uma a menos; descendo, uma a mais. Vale também nas viradas:
 * o 2 que sobe veio do 1, e o máximo-1 que desce veio do máximo. O sentido é mantido,
 * porque nas viradas os dois sentidos dão o mesmo próximo passo.
 */
export const getPreviousRoundCards = (
  current: number,
  direction: CardsDirection,
): { cards: number; direction: CardsDirection } => ({
  cards: direction === 'up' ? Math.max(1, current - 1) : current + 1,
  direction,
});

/** Última rodada em que alguém da mesa de agora jogou; -1 se ninguém jogou nenhuma. */
const getLastPlayedRound = (players: readonly Player[]): number => {
  for (let round = getRoundCount(players) - 1; round >= 0; round -= 1) {
    if (players.some((p) => typeof p.history[round] === 'number')) return round;
  }
  return -1;
};

/**
 * Fim de jogo: só existe com mesa (2+ jogadores) e ao menos uma rodada jogada. Se ninguém
 * sobreviveu, empatam os que caíram juntos na última rodada que a mesa jogou.
 */
export const getGameOutcome = (players: readonly Player[]): FodinhaOutcome => {
  const roundCount = getRoundCount(players);
  if (players.length < 2 || roundCount === 0) return { status: 'playing' };

  const alive = players.filter(isAlive);
  if (alive.length > 1) return { status: 'playing' };
  if (alive.length === 1) return { status: 'won', winner: alive[0] };

  // Todos mortos: quem jogou a última rodada estava vivo nela, então caiu ali. Não é
  // sempre a última coluna — o vencedor pode ter sido removido da mesa.
  const lastPlayed = getLastPlayedRound(players);
  const fellTogether = players.filter((p) => typeof p.history[lastPlayed] === 'number');
  return { status: 'tie', players: fellTogether.length > 0 ? fellTogether : [...players] };
};

export interface RoundTransition {
  cardsInRound: number;
  cardsDirection: CardsDirection;
  outcome: FodinhaOutcome;
}

/**
 * O que muda depois de uma rodada fechada. Recebe os jogadores JÁ com o dano aplicado:
 * quem caiu nesta rodada não conta para o limite de cartas da próxima.
 */
export const getRoundTransition = (
  finishedPlayers: readonly Player[],
  config: { cardsInRound: number; cardsDirection: CardsDirection; deckCount: number },
): RoundTransition => {
  const max = getMaxCards(config.deckCount, countAlive(finishedPlayers));
  const next = getNextRoundCards(config.cardsInRound, config.cardsDirection, max);
  return {
    cardsInRound: next.cards,
    cardsDirection: next.direction,
    outcome: getGameOutcome(finishedPlayers),
  };
};

export const logicRemovePlayer = (players: Player[], pId: string) => {
  return players.filter((p) => p.id !== pId);
};

export const logicAddPlayer = (
  players: readonly Player[],
  newcomer: { id: string; name: string },
  initialLives: number,
): Player[] => [
  ...players,
  {
    ...newcomer,
    lives: initialLives,
    // Quem chega no meio do jogo não jogou as rodadas anteriores.
    history: new Array<number | null>(getRoundCount(players)).fill(null),
    currentBid: 0,
    currentWon: 0,
  },
];

export const logicUpdateHistoryDamage = (
  players: Player[],
  pId: string,
  delta: number,
  roundIdx: number,
  initialLives: number,
) => {
  return players.map((p) => {
    if (p.id !== pId) return p;
    const currentDamage = p.history[roundIdx];
    // Rodada que o jogador não jogou não tem dano para ajustar.
    if (typeof currentDamage !== 'number') return p;

    const history = p.history.map((damage, i) =>
      i === roundIdx ? Math.max(0, currentDamage + delta) : damage,
    );
    return { ...p, history, lives: computeLives(initialLives, history, p.livesAdjustment) };
  });
};

export const logicUpdateValue = (
  players: Player[],
  pId: string,
  delta: number,
  phase: RoundPhase,
  cardsInRound: number,
) => {
  return players.map((p) => {
    if (p.id !== pId || !isAlive(p)) return p;
    if (phase === 'betting') {
      const newBid = Math.max(0, Math.min(cardsInRound, p.currentBid + delta));
      return { ...p, currentBid: newBid };
    } else {
      const newWon = Math.max(0, Math.min(cardsInRound, p.currentWon + delta));
      return { ...p, currentWon: newWon };
    }
  });
};

/**
 * Define aposta ou vazas com um valor absoluto.
 *
 * `logicUpdateValue` trabalha com delta (+1/-1), que é o que os botões da tela precisam.
 * A voz fala valor absoluto ("apostou dois"), então precisa deste caminho. Mesmo limite:
 * nunca sai de 0..cardsInRound, e eliminado não aposta.
 */
export const logicSetValue = (
  players: Player[],
  pId: string,
  value: number,
  phase: RoundPhase,
  cardsInRound: number,
) => {
  return players.map((p) => {
    if (p.id !== pId || !isAlive(p)) return p;
    const clamped = Math.max(0, Math.min(cardsInRound, value));
    return phase === 'betting' ? { ...p, currentBid: clamped } : { ...p, currentWon: clamped };
  });
};

/** Quando a mão diminui, aposta ou vazas acima dela ficariam impossíveis. */
export const logicClampValues = (players: Player[], cardsInRound: number): Player[] =>
  players.map((p) => {
    if (p.currentBid <= cardsInRound && p.currentWon <= cardsInRound) return p;
    return {
      ...p,
      currentBid: Math.min(p.currentBid, cardsInRound),
      currentWon: Math.min(p.currentWon, cardsInRound),
    };
  });

/** Uma alteração proposta pela voz, já resolvida para um jogador. */
export interface FodinhaVoiceEntry {
  playerId: string;
  value: number;
}

export interface FodinhaBatchResult {
  updatedPlayers: Player[];
  nextPhase: RoundPhase;
  /** `true` quando a fase mudou ou a rodada fechou. */
  advanced: boolean;
  /** `true` quando a rodada fechou — quem chama prepara a próxima com `getRoundTransition`. */
  roundFinished: boolean;
  hasError: boolean;
  /** Prefixo da chave de i18n: `fodinha.<errorKey>_title` / `_message`. */
  errorKey?: 'invalid_bets' | 'wrong_count';
  errorParams?: { total: number; cards: number };
}

/**
 * Aplica um lote de voz e, opcionalmente, avança a fase — numa única operação pura.
 *
 * Precisa ser atômico: `handlePhaseChange` valida contra `totalBids`/`totalWon`, que são
 * `useMemo` e ficam velhos no mesmo tick de um `setPlayers`. Aplicar e depois avançar
 * validaria contra o estado anterior ao lote.
 *
 * Em caso de erro os valores continuam aplicados e só o avanço é segurado.
 */
export const applyVoiceBatch = (
  players: Player[],
  batch: readonly FodinhaVoiceEntry[],
  config: {
    phase: RoundPhase;
    cardsInRound: number;
    penaltyMode: PenaltyMode;
  },
  options: { advance: boolean },
): FodinhaBatchResult => {
  const staged = batch.reduce(
    (acc, entry) =>
      logicSetValue(acc, entry.playerId, entry.value, config.phase, config.cardsInRound),
    players,
  );

  const base = { updatedPlayers: staged, advanced: false, roundFinished: false, hasError: false };
  if (!options.advance) return { ...base, nextPhase: config.phase };

  // A exigência de cobertura vale só para as APOSTAS.
  //
  // Ali o silêncio é ambíguo: `currentBid` nasce 0, então quem não foi citado é
  // indistinguível de quem pediu zero. Um valor explícito de zero conta como aposta feita
  // ("não vai fazer nada" cobre o jogador); o silêncio, não.
  //
  // No RESULTADO não há ambiguidade: a soma das vazas TEM de bater com o número de
  // cartas, e essa igualdade já é a prova de que a fase acabou. Com 1 carta, um único
  // "matheus fez" fecha a rodada — exigir cobertura ali só travaria o caminho normal.
  const living = staged.filter(isAlive);
  const covered = new Set(batch.map((entry) => entry.playerId));
  if (config.phase === 'betting' && living.length > 0 && !living.every((p) => covered.has(p.id))) {
    return { ...base, nextPhase: config.phase };
  }

  if (config.phase === 'betting') {
    // Regra da Fodinha: a soma das apostas não pode fechar com o número de cartas.
    const total = sumLiving(staged, 'currentBid');
    if (total === config.cardsInRound) {
      return {
        ...base,
        nextPhase: 'betting',
        hasError: true,
        errorKey: 'invalid_bets',
        errorParams: { total, cards: config.cardsInRound },
      };
    }
    return { ...base, nextPhase: 'results', advanced: true };
  }

  const total = sumLiving(staged, 'currentWon');

  // Ainda faltam vazas: aplica o que foi dito e espera. Cantar vaza a vaza é o caminho
  // normal da fase de resultado, não um erro — alertar aqui era barulho a cada anúncio.
  if (total < config.cardsInRound) {
    return { ...base, nextPhase: 'results' };
  }

  // Passar do número de cartas, por outro lado, é engano de verdade: mais vazas do que
  // existem na mão. Vale avisar, senão a rodada fecha com um placar impossível.
  if (total > config.cardsInRound) {
    return {
      ...base,
      nextPhase: 'results',
      hasError: true,
      errorKey: 'wrong_count',
      errorParams: { total, cards: config.cardsInRound },
    };
  }

  return {
    updatedPlayers: logicFinishRound(staged, config.penaltyMode),
    nextPhase: 'betting',
    advanced: true,
    roundFinished: true,
    hasError: false,
  };
};

export const logicRemoveRound = (players: Player[], roundIdx: number, initialLives: number) => {
  return players.map((p) => {
    const history = p.history.filter((_, i) => i !== roundIdx);
    return { ...p, history, lives: computeLives(initialLives, history, p.livesAdjustment) };
  });
};

/**
 * Apagar uma rodada também volta um passo na sequência de cartas: com uma rodada a menos
 * no histórico, a mão atual é a que vinha antes. Sem isso o contador ficava adiantado
 * (1 rodada no histórico e a mesa já pedindo 3 cartas).
 *
 * O número voltado respeita o limite da mesa de agora — apagar a rodada pode trazer alguém
 * de volta — e apostas ou vazas acima dele descem junto.
 */
export const getRoundDeletion = (
  players: Player[],
  roundIdx: number,
  config: {
    initialLives: number;
    cardsInRound: number;
    cardsDirection: CardsDirection;
    deckCount: number;
  },
): { players: Player[]; cardsInRound: number; cardsDirection: CardsDirection } => {
  const remaining = logicRemoveRound(players, roundIdx, config.initialLives);
  const previous = getPreviousRoundCards(config.cardsInRound, config.cardsDirection);
  const cards = Math.min(previous.cards, getMaxCards(config.deckCount, countAlive(remaining)));
  return {
    players: logicClampValues(remaining, cards),
    cardsInRound: cards,
    cardsDirection: previous.direction,
  };
};

export const logicFinishRound = (players: Player[], penaltyMode: PenaltyMode) => {
  return players.map((p) => {
    // O eliminado também ganha a posição da rodada, marcada como "não jogou", para o
    // índice do histórico continuar sendo o número da rodada para todos.
    if (!isAlive(p)) return { ...p, history: [...p.history, null], currentBid: 0, currentWon: 0 };

    const damage = getRoundDamage(p.currentBid, p.currentWon, penaltyMode);
    return {
      ...p,
      lives: Math.max(0, p.lives - damage),
      history: [...p.history, damage],
      currentBid: 0,
      currentWon: 0,
    };
  });
};

// --- Persistência ---

export interface FodinhaSave {
  players: FodinhaPlayer[];
  initialLives: number;
  penaltyMode: PenaltyMode;
  cardsInRound: number;
  roundPhase: RoundPhase;
  deckCount: number;
  cardsDirection: CardsDirection;
}

const parsePlayer = (raw: unknown, initialLives: number): Player | null => {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;

  // Buracos de arrays esparsos viram `null` no JSON: rodada sem dano registrado.
  const history = Array.isArray(raw.history)
    ? raw.history.map((damage: unknown) => (isNonNegativeNumber(damage) ? damage : null))
    : [];

  const livesAdjustment = intInRange(
    raw.livesAdjustment,
    -MAX_LIVES_ADJUSTMENT_SANITY,
    MAX_LIVES_ADJUSTMENT_SANITY,
    0,
  );

  return {
    id: raw.id,
    name: raw.name,
    lives: isNonNegativeNumber(raw.lives)
      ? raw.lives
      : computeLives(initialLives, history, livesAdjustment),
    history,
    currentBid: intInRange(raw.currentBid, 0, MAX_CARDS_SANITY, 0),
    currentWon: intInRange(raw.currentWon, 0, MAX_CARDS_SANITY, 0),
    // Só quem foi corrigido leva o campo: saves sem correção continuam com o mesmo formato.
    ...(livesAdjustment === 0 ? {} : { livesAdjustment }),
  };
};

const isPlayer = (player: Player | null): player is Player => player !== null;

/**
 * Valida o que veio do disco, gravado por esta ou por uma versão anterior do app.
 *
 * Saves antigos não têm baralhos nem direção, e os históricos tinham tamanhos diferentes.
 * Aqui eles são completados com `null` para as colunas voltarem a alinhar:
 * - eliminado: o histórico parou quando ele caiu, então completa no fim;
 * - vivo com histórico curto: entrou depois que o jogador 1 caiu (o app antigo copiava o
 *   tamanho do histórico dele), então as rodadas dele são as mais recentes e completa no
 *   começo.
 *
 * A rodada em andamento não é mexida, mesmo com cartas acima do limite — a próxima já
 * entra nele.
 *
 * Devolve `null` quando não dá para confiar na estrutura.
 */
export const parseFodinhaSave = (raw: unknown): FodinhaSave | null => {
  if (!isRecord(raw) || !Array.isArray(raw.players)) return null;

  const initialLives = intInRange(raw.initialLives, MIN_LIVES, MAX_LIVES, DEFAULT_LIVES);
  const parsed = raw.players.map((entry: unknown) => parsePlayer(entry, initialLives));
  if (!parsed.every(isPlayer)) return null;

  const roundCount = getRoundCount(parsed);
  const players = parsed.map((p) => {
    const padding = new Array<null>(roundCount - p.history.length).fill(null);
    return { ...p, history: isAlive(p) ? [...padding, ...p.history] : [...p.history, ...padding] };
  });

  return {
    players,
    initialLives,
    penaltyMode: oneOf(raw.penaltyMode, PENALTY_MODES, 'fixed'),
    cardsInRound: intInRange(raw.cardsInRound, 1, MAX_CARDS_SANITY, 1),
    roundPhase: oneOf(raw.roundPhase, ROUND_PHASES, 'betting'),
    deckCount: intInRange(raw.deckCount, MIN_DECKS, MAX_DECKS, MIN_DECKS),
    cardsDirection: oneOf(raw.cardsDirection, CARDS_DIRECTIONS, 'up'),
  };
};

const createDefaultPlayers = (): Player[] =>
  [1, 2, 3].map((n) => ({
    id: String(n),
    name: `${translate('common.player')} ${String(n)}`,
    lives: DEFAULT_LIVES,
    history: [],
    currentBid: 0,
    currentWon: 0,
  }));

// --- Hook principal ---
export const useFodinhaGame = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [initialLives, setInitialLives] = useState(DEFAULT_LIVES);
  const [penaltyMode, setPenaltyMode] = useState<PenaltyMode>('fixed');
  const [deckCount, setDeckCountState] = useState(MIN_DECKS);
  const [cardsInRound, setCardsInRound] = useState(1);
  const [cardsDirection, setCardsDirection] = useState<CardsDirection>('up');
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('betting');
  const [players, setPlayers] = useState<Player[]>(createDefaultPlayers);
  /**
   * Aberto só quando uma rodada fecha o jogo. Derivar do placar faria o aviso reaparecer
   * a cada vez que a tela abre num jogo já encerrado, ou no meio de uma edição de rodada.
   */
  const [gameOverVisible, setGameOverVisible] = useState(false);

  useEffect(() => {
    let active = true;
    void getData(STORAGE_KEYS.FODINHA_DATA).then((raw) => {
      if (!active) return;
      const saved = parseFodinhaSave(raw);
      if (saved) {
        setPlayers(saved.players);
        setInitialLives(saved.initialLives);
        setPenaltyMode(saved.penaltyMode);
        setDeckCountState(saved.deckCount);
        setCardsInRound(saved.cardsInRound);
        setCardsDirection(saved.cardsDirection);
        setRoundPhase(saved.roundPhase);
      }
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const save = useMemo<FodinhaSave>(
    () => ({
      players,
      initialLives,
      penaltyMode,
      cardsInRound,
      roundPhase,
      deckCount,
      cardsDirection,
    }),
    [players, initialLives, penaltyMode, cardsInRound, roundPhase, deckCount, cardsDirection],
  );
  useAutoSave(STORAGE_KEYS.FODINHA_DATA, save, isLoaded);

  const outcome = useMemo(() => getGameOutcome(players), [players]);
  const isGameOver = outcome.status !== 'playing';
  const livingPlayers = useMemo(() => players.filter(isAlive), [players]);
  const maxCards = getMaxCards(deckCount, livingPlayers.length);

  const totalBids = useMemo(() => sumLiving(players, 'currentBid'), [players]);
  const totalWon = useMemo(() => sumLiving(players, 'currentWon'), [players]);

  // Depende só da contagem: mudar uma aposta não recria a lista de colunas.
  const roundCount = getRoundCount(players);
  const rounds = useMemo<FodinhaRound[]>(
    () =>
      Array.from({ length: roundCount }, (_, index) => ({ id: `round_${String(index)}`, index })),
    [roundCount],
  );

  /** Grava a rodada fechada e prepara a próxima — o mesmo caminho para o botão e a voz. */
  const commitFinishedRound = (finishedPlayers: Player[]) => {
    const transition = getRoundTransition(finishedPlayers, {
      cardsInRound,
      cardsDirection,
      deckCount,
    });
    setPlayers(finishedPlayers);
    setCardsInRound(transition.cardsInRound);
    setCardsDirection(transition.cardsDirection);
    setRoundPhase('betting');
    if (transition.outcome.status !== 'playing') setGameOverVisible(true);
  };

  const handlePhaseChange = () => {
    if (isGameOver) return;

    if (roundPhase === 'betting') {
      if (totalBids === cardsInRound) {
        Alert.alert(
          translate('fodinha.invalid_bets_title'),
          translate('fodinha.invalid_bets_message', { total: totalBids, cards: cardsInRound }),
        );
        return;
      }
      setRoundPhase('results');
      return;
    }

    if (totalWon !== cardsInRound) {
      Alert.alert(
        translate('fodinha.wrong_count_title'),
        translate('fodinha.wrong_count_message', { total: totalWon, cards: cardsInRound }),
      );
      return;
    }
    commitFinishedRound(logicFinishRound(players, penaltyMode));
  };

  const adjustValue = (playerId: string, delta: number) => {
    if (isGameOver) return;
    setPlayers((prev) => logicUpdateValue(prev, playerId, delta, roundPhase, cardsInRound));
  };

  /**
   * Aplica o lote pendente da voz. Com `advance`, confirma a fase **se o lote cobriu todos
   * os jogadores vivos**. Devolve `true` quando o lote foi aplicado.
   */
  const applyVoiceEntries = (batch: readonly FodinhaVoiceEntry[], advance: boolean): boolean => {
    // Jogo encerrado: o placar está fechado e o lote é descartado. A tela também esconde
    // o microfone e limpa a fila nesse momento.
    if (isGameOver) return true;

    const result = applyVoiceBatch(
      players,
      batch,
      { phase: roundPhase, cardsInRound, penaltyMode },
      { advance },
    );

    if (result.hasError) {
      setPlayers(result.updatedPlayers);
      Alert.alert(
        translate(`fodinha.${result.errorKey ?? 'wrong_count'}_title`),
        translate(`fodinha.${result.errorKey ?? 'wrong_count'}_message`, result.errorParams),
      );
      return false;
    }

    if (result.roundFinished) {
      commitFinishedRound(result.updatedPlayers);
      return true;
    }

    // Aplicou sem erro: a fila limpa mesmo quando a fase não mudou, porque os valores já
    // estão visíveis no placar.
    setPlayers(result.updatedPlayers);
    setRoundPhase(result.nextPhase);
    return true;
  };

  /** Correção manual do cabeçalho: só antes das apostas fecharem, e nunca acima do limite. */
  const increaseCards = () => {
    if (roundPhase !== 'betting' || isGameOver || cardsInRound >= maxCards) return;
    setCardsInRound(cardsInRound + 1);
  };

  const decreaseCards = () => {
    if (roundPhase !== 'betting' || isGameOver || cardsInRound <= 1) return;
    const next = cardsInRound - 1;
    setCardsInRound(next);
    setPlayers((prev) => logicClampValues(prev, next));
  };

  /**
   * Aplica uma mudança na mesa (alguém entrou, voltou ao jogo pela edição do histórico, ou
   * caiu o número de baralhos). Enquanto as apostas estão abertas a mão ainda pode mudar:
   * se o limite novo ficou abaixo dela, o número de cartas e as apostas descem junto.
   *
   * Os jogadores seguem por atualização funcional; só o limite é calculado sobre o estado
   * desta renderização, que é o que o toque viu.
   */
  const updateTable = (update: (prev: Player[]) => Player[], nextDeckCount = deckCount) => {
    const limit = getMaxCards(nextDeckCount, countAlive(update(players)));
    const mustClamp = roundPhase === 'betting' && cardsInRound > limit;
    setPlayers((prev) => (mustClamp ? logicClampValues(update(prev), limit) : update(prev)));
    if (mustClamp) setCardsInRound(limit);
  };

  const setDeckCount = (count: number) => {
    const next = Math.max(MIN_DECKS, Math.min(MAX_DECKS, count));
    setDeckCountState(next);
    updateTable((prev) => prev, next);
  };

  const adjustHistoryDamage = (playerId: string, delta: number, roundIdx: number) => {
    updateTable((prev) => logicUpdateHistoryDamage(prev, playerId, delta, roundIdx, initialLives));
  };

  /**
   * Correção manual das vidas pelo modal do jogador. Pode trazer alguém de volta (a mesa
   * cresce e o limite de cartas cai junto) ou eliminar.
   */
  const setPlayerLives = (playerId: string, lives: number) => {
    // Depois do fim o placar está fechado: mexer nas vidas mudaria quem venceu.
    if (isGameOver) return;
    const update = (prev: Player[]) => logicSetLives(prev, playerId, lives, initialLives);
    updateTable(update);
    // Zerar alguém pode deixar um só vivo: o fim é avisado como numa rodada.
    if (getGameOutcome(update(players)).status !== 'playing') setGameOverVisible(true);
  };

  // Função auxiliar para o Alert não ficar aninhado
  const confirmDeleteRound = (roundIdx: number, onCloseOverlay: () => void) => {
    const result = getRoundDeletion(players, roundIdx, {
      initialLives,
      cardsInRound,
      cardsDirection,
      deckCount,
    });
    setPlayers(result.players);
    setCardsInRound(result.cardsInRound);
    setCardsDirection(result.cardsDirection);
    onCloseOverlay();
  };

  const deleteRound = (roundIdx: number, onCloseOverlay: () => void) => {
    Alert.alert(translate('cacheta.delete_round'), translate('cacheta.confirm_delete_round'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.confirm'),
        style: 'destructive',
        onPress: () => {
          confirmDeleteRound(roundIdx, onCloseOverlay);
        },
      },
    ]);
  };

  const handleReset = () => {
    setPlayers((prev) => logicResetPlayers(prev, initialLives));
    setCardsInRound(1);
    setCardsDirection('up');
    setRoundPhase('betting');
    setGameOverVisible(false);
  };

  const handleAddPlayer = () => {
    // Entrar alguém depois do fim reabriria o jogo sem querer.
    if (isGameOver) return;
    // Fora do updater: o StrictMode roda o updater duas vezes.
    const id = Date.now().toString();
    updateTable((prev) =>
      logicAddPlayer(
        prev,
        { id, name: `${translate('common.player')} ${String(prev.length + 1)}` },
        initialLives,
      ),
    );
  };

  const removePlayer = (pId: string) => {
    // Depois do fim o placar está fechado: tirar alguém mudaria quem venceu.
    if (isGameOver) return;
    setPlayers((prev) => logicRemovePlayer(prev, pId));
    // Tirar alguém pode deixar um só vivo: o fim é avisado como numa rodada.
    if (getGameOutcome(logicRemovePlayer(players, pId)).status !== 'playing') {
      setGameOverVisible(true);
    }
  };

  const dismissGameOver = () => {
    setGameOverVisible(false);
  };

  return {
    isLoaded,
    players,
    livingPlayers,
    setPlayers,
    initialLives,
    setInitialLives,
    penaltyMode,
    setPenaltyMode,
    deckCount,
    setDeckCount,
    maxCards,
    cardsInRound,
    increaseCards,
    decreaseCards,
    roundPhase,
    totalBids,
    totalWon,
    rounds,
    outcome,
    isGameOver,
    gameOverVisible,
    dismissGameOver,
    handlePhaseChange,
    adjustValue,
    applyVoiceEntries,
    adjustHistoryDamage,
    deleteRound,
    handleReset,
    handleAddPlayer,
    removePlayer,
    setPlayerLives,
  };
};
