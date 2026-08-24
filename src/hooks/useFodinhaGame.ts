import { useState, useEffect, useMemo, type RefObject } from 'react';
import { Alert, type ScrollView } from 'react-native';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { translate } from '../i18n';

export interface FodinhaPlayer {
  id: string;
  name: string;
  lives: number;
  history: number[];
  currentBid: number;
  currentWon: number;
}
type Player = FodinhaPlayer;

// Lógica pura para calcular dano e atualizar histórico

export const logicRemovePlayer = (players: Player[], pId: string) => {
  return players.filter((p) => p.id !== pId);
};

export const logicUpdateHistoryDamage = (
  players: Player[],
  pId: string,
  delta: number,
  roundIdx: number,
  initialLives: number,
) => {
  return players.map((p) => {
    if (p.id !== pId) return p;
    const newHistory = [...p.history];
    const currentDamage = newHistory[roundIdx] || 0;
    const newDamage = Math.max(0, currentDamage + delta);
    newHistory[roundIdx] = newDamage;
    const totalDamage = newHistory.reduce((a, b) => a + b, 0);
    return { ...p, history: newHistory, lives: initialLives - totalDamage };
  });
};

export const logicUpdateValue = (
  players: Player[],
  pId: string,
  delta: number,
  phase: 'betting' | 'results',
  cardsInRound: number,
) => {
  return players.map((p) => {
    if (p.id !== pId) return p;
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
 * nunca sai de 0..cardsInRound.
 */
export const logicSetValue = (
  players: Player[],
  pId: string,
  value: number,
  phase: 'betting' | 'results',
  cardsInRound: number,
) => {
  return players.map((p) => {
    if (p.id !== pId) return p;
    const clamped = Math.max(0, Math.min(cardsInRound, value));
    return phase === 'betting' ? { ...p, currentBid: clamped } : { ...p, currentWon: clamped };
  });
};

/** Uma alteração proposta pela voz, já resolvida para um jogador. */
export interface FodinhaVoiceEntry {
  playerId: string;
  value: number;
}

export interface FodinhaBatchResult {
  updatedPlayers: Player[];
  nextPhase: 'betting' | 'results';
  /** `true` quando a fase mudou ou a rodada fechou. */
  advanced: boolean;
  /** `true` quando a rodada fechou — quem chama precisa incrementar `cardsInRound`. */
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
    phase: 'betting' | 'results';
    cardsInRound: number;
    penaltyMode: 'fixed' | 'difference';
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
  const living = staged.filter((p) => p.lives > 0);
  const covered = new Set(batch.map((entry) => entry.playerId));
  if (config.phase === 'betting' && living.length > 0 && !living.every((p) => covered.has(p.id))) {
    return { ...base, nextPhase: config.phase };
  }

  if (config.phase === 'betting') {
    // Regra da Fodinha: a soma das apostas não pode fechar com o número de cartas.
    const total = staged.reduce((acc, p) => acc + p.currentBid, 0);
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

  const total = staged.reduce((acc, p) => acc + p.currentWon, 0);

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
    const newHistory = [...p.history];
    newHistory.splice(roundIdx, 1);
    const totalDamage = newHistory.reduce((a, b) => a + b, 0);
    return { ...p, history: newHistory, lives: initialLives - totalDamage };
  });
};

export const logicFinishRound = (players: Player[], penaltyMode: 'fixed' | 'difference') => {
  return players.map((p) => {
    if (p.lives <= 0) return p;
    const diff = Math.abs(p.currentBid - p.currentWon);
    let damage = 0;
    if (diff > 0) damage = penaltyMode === 'fixed' ? 1 : diff;

    return {
      ...p,
      lives: Math.max(0, p.lives - damage),
      history: [...p.history, damage],
      currentBid: 0,
      currentWon: 0,
    };
  });
};
// --- Hook principal ---
export const useFodinhaGame = (scrollRef: RefObject<ScrollView>) => {
  const [initialLives, setInitialLives] = useState(10);
  const [penaltyMode, setPenaltyMode] = useState<'fixed' | 'difference'>('fixed');
  const [cardsInRound, setCardsInRound] = useState(1);
  const [roundPhase, setRoundPhase] = useState<'betting' | 'results'>('betting');

  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      name: translate('common.player') + ' 1',
      lives: 10,
      history: [],
      currentBid: 0,
      currentWon: 0,
    },
    {
      id: '2',
      name: translate('common.player') + ' 2',
      lives: 10,
      history: [],
      currentBid: 0,
      currentWon: 0,
    },
    {
      id: '3',
      name: translate('common.player') + ' 3',
      lives: 10,
      history: [],
      currentBid: 0,
      currentWon: 0,
    },
  ]);

  const removePlayer = (pId: string) => {
    setPlayers((prev) => logicRemovePlayer(prev, pId));
  };

  useEffect(() => {
    const loadData = async () => {
      const saved = (await getData(STORAGE_KEYS.FODINHA_DATA)) as {
        players: FodinhaPlayer[];
        initialLives: number;
        penaltyMode?: 'fixed' | 'difference';
        cardsInRound?: number;
        roundPhase?: 'betting' | 'results';
      } | null;
      if (saved) {
        setPlayers(saved.players);
        setInitialLives(saved.initialLives);
        setPenaltyMode(saved.penaltyMode ?? 'fixed');
        setCardsInRound(saved.cardsInRound ?? 1);
        setRoundPhase(saved.roundPhase ?? 'betting');
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    void saveData(STORAGE_KEYS.FODINHA_DATA, {
      players,
      initialLives,
      penaltyMode,
      cardsInRound,
      roundPhase,
    });
  }, [players, initialLives, penaltyMode, cardsInRound, roundPhase]);

  const totalBids = useMemo(() => players.reduce((acc, p) => acc + p.currentBid, 0), [players]);
  const totalWon = useMemo(() => players.reduce((acc, p) => acc + p.currentWon, 0), [players]);

  // Criamos um objeto rounds que tem um ID único artificial.
  // Usamos useMemo para não recriar a cada render.
  const rounds = useMemo(() => {
    if (players.length === 0) return [];
    return players[0].history.map((_, i) => ({ id: `round_${String(i)}`, index: i }));
  }, [players]);

  const finishRound = () => {
    setPlayers((prev) => logicFinishRound(prev, penaltyMode)); // Chama lógica externa
    setCardsInRound((prev) => prev + 1);
    setRoundPhase('betting');
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handlePhaseChange = () => {
    if (roundPhase === 'betting') {
      if (totalBids === cardsInRound) {
        Alert.alert(
          translate('fodinha.invalid_bets_title'),
          translate('fodinha.invalid_bets_message', { total: totalBids, cards: cardsInRound }),
        );
        return;
      }
      setRoundPhase('results');
    } else {
      if (totalWon !== cardsInRound) {
        Alert.alert(
          translate('fodinha.wrong_count_title'),
          translate('fodinha.wrong_count_message', { total: totalWon, cards: cardsInRound }),
        );
        return;
      }
      finishRound();
    }
  };

  const adjustValue = (playerId: string, delta: number) => {
    setPlayers((prev) => logicUpdateValue(prev, playerId, delta, roundPhase, cardsInRound));
  };

  /**
   * Aplica o lote pendente da voz. Com `advance`, confirma a fase **se o lote cobriu todos
   * os jogadores vivos**. Devolve `true` quando o lote foi aplicado.
   */
  const applyVoiceEntries = (batch: readonly FodinhaVoiceEntry[], advance: boolean): boolean => {
    const result = applyVoiceBatch(
      players,
      batch,
      { phase: roundPhase, cardsInRound, penaltyMode },
      { advance },
    );

    setPlayers(result.updatedPlayers);

    if (result.hasError) {
      Alert.alert(
        translate(`fodinha.${result.errorKey ?? 'wrong_count'}_title`),
        translate(`fodinha.${result.errorKey ?? 'wrong_count'}_message`, result.errorParams),
      );
      return false;
    }

    setRoundPhase(result.nextPhase);
    if (result.roundFinished) {
      setCardsInRound((prev) => prev + 1);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }

    // Aplicou sem erro: a fila limpa mesmo quando a fase não mudou, porque os valores já
    // estão visíveis no placar.
    return true;
  };

  const adjustHistoryDamage = (playerId: string, delta: number, roundIdx: number) => {
    setPlayers((prev) => logicUpdateHistoryDamage(prev, playerId, delta, roundIdx, initialLives));
  };

  // Função auxiliar para o Alert não ficar aninhado
  const confirmDeleteRound = (roundIdx: number, onCloseOverlay: () => void) => {
    setPlayers((prev) => logicRemoveRound(prev, roundIdx, initialLives));
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
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, lives: initialLives, history: [], currentBid: 0, currentWon: 0 })),
    );
    setCardsInRound(1);
    setRoundPhase('betting');
  };

  const handleAddPlayer = () => {
    setPlayers((prev) => {
      const currentRounds = prev.length > 0 ? prev[0].history.length : 0;
      return [
        ...prev,
        {
          id: Date.now().toString(),
          name: `${translate('common.player')} ${String(prev.length + 1)}`,
          lives: initialLives,
          history: new Array<number>(currentRounds).fill(0),
          currentBid: 0,
          currentWon: 0,
        },
      ];
    });
  };

  return {
    players,
    setPlayers,
    initialLives,
    setInitialLives,
    penaltyMode,
    setPenaltyMode,
    cardsInRound,
    setCardsInRound,
    roundPhase,
    setRoundPhase,
    totalBids,
    totalWon,
    rounds,
    handlePhaseChange,
    adjustValue,
    applyVoiceEntries,
    adjustHistoryDamage,
    deleteRound,
    handleReset,
    handleAddPlayer,
    removePlayer,
  };
};
