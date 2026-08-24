import { useState, useEffect, useMemo, type RefObject } from 'react';
import { Alert, type ScrollView } from 'react-native';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { translate } from '../i18n';

export type CachetaAction = 'won' | 'fold' | 'lost' | null;

export interface CachetaPlayer {
  id: string;
  name: string;
  history: CachetaAction[];
  currentAction: CachetaAction;
}

export interface CachetaPlayerWithPoints extends CachetaPlayer {
  currentPoints: number;
}

/** Uma alteração proposta pela voz, já resolvida para um jogador. */
export interface CachetaVoiceEntry {
  playerId: string;
  action: CachetaAction;
}

// --- PURE FUNCTIONS ---

/**
 * Pontos derivados do histórico. Extraído do `useMemo` do hook porque `applyVoiceBatch`
 * precisa recalcular a partir do estado *já alterado*, e não do estado do render atual.
 */
export const calculatePlayerPoints = (
  players: CachetaPlayer[],
  initialPoints: number,
): CachetaPlayerWithPoints[] => {
  return players.map((p) => {
    let pts = initialPoints;
    p.history.forEach((act) => {
      if (act === 'fold') pts -= 1;
      if (act === 'lost') pts -= 2;
    });
    return { ...p, currentPoints: Math.max(0, pts) };
  });
};
export const processNextRound = (
  players: CachetaPlayer[],
  playersWithPoints: CachetaPlayerWithPoints[],
): { updatedPlayers: CachetaPlayer[]; hasError: boolean; errorKey?: string } => {
  const playersToUpdate = players.map((p, idx) => {
    const pWithPts = playersWithPoints[idx];
    // Se o jogador está vivo e não escolheu ação, assume derrota (lost)
    if (pWithPts.currentPoints > 0 && p.currentAction === null) {
      return { ...p, currentAction: 'lost' as CachetaAction };
    }
    return p;
  });

  const activePlayers = playersWithPoints.filter((p) => p.currentPoints > 0);
  const winnersCount = playersToUpdate.filter((p) => p.currentAction === 'won').length;

  // REGRA 1: Se tem jogadores vivos, precisa de um ganhador
  // REGRA 2: Não pode ter mais de 1 ganhador
  if (activePlayers.length > 0 && winnersCount !== 1) {
    return {
      updatedPlayers: players,
      hasError: true,
      errorKey: winnersCount === 0 ? 'cacheta.need_winner' : 'cacheta.multiple_winners',
    };
  }

  const finalPlayers = playersToUpdate.map((p) => ({
    ...p,
    history: [...p.history, p.currentAction],
    currentAction: null,
  }));

  return { updatedPlayers: finalPlayers, hasError: false };
};

export const updatePlayerActionInList = (
  players: CachetaPlayer[],
  pId: string,
  action: CachetaAction,
): CachetaPlayer[] => {
  return players.map((p) => {
    // Se estamos marcando alguém como WON, precisamos desmarcar qualquer outro WON
    if (action === 'won') {
      if (p.id === pId) return { ...p, currentAction: 'won' }; // Marca o alvo
      if (p.currentAction === 'won') return { ...p, currentAction: null }; // Desmarca os outros
      return p;
    }

    // Comportamento normal para outras ações (fold, lost, null)
    if (p.id !== pId) return p;
    return { ...p, currentAction: action === p.currentAction ? null : action };
  });
};

/**
 * Define a ação de um jogador de forma absoluta.
 *
 * Diferente de `updatePlayerActionInList`, que alterna: repetir a mesma ação lá limpa o
 * valor. Alternar é o certo para um toque, mas errado para um lote de voz — se o usuário
 * já tivesse marcado "correu" no dedo e a voz dissesse a mesma coisa, a ação sumiria.
 * A regra de ganhador único continua valendo.
 */
export const setPlayerActionInList = (
  players: CachetaPlayer[],
  pId: string,
  action: CachetaAction,
): CachetaPlayer[] => {
  return players.map((p) => {
    if (p.id === pId) return { ...p, currentAction: action };
    if (action === 'won' && p.currentAction === 'won') return { ...p, currentAction: null };
    return p;
  });
};

/**
 * Aplica um lote de voz e, opcionalmente, avança a rodada — numa única operação pura.
 *
 * Precisa ser atômico: `handleNextRound` lê `playersWithPoints`, que é um `useMemo` e
 * fica velho no mesmo tick de um `setPlayers`. Chamar "aplica" e depois "avança" faria a
 * validação rodar contra o estado anterior ao lote.
 *
 * Em caso de erro, as ações continuam aplicadas e só o avanço é segurado — o usuário não
 * perde o que falou, só corrige o que está errado.
 */
export const applyVoiceBatch = (
  players: CachetaPlayer[],
  initialPoints: number,
  batch: readonly CachetaVoiceEntry[],
  options: { advance: boolean },
): {
  updatedPlayers: CachetaPlayer[];
  /** `true` só quando a rodada de fato fechou. */
  advanced: boolean;
  hasError: boolean;
  errorKey?: string;
} => {
  const staged = batch.reduce(
    (acc, entry) => setPlayerActionInList(acc, entry.playerId, entry.action),
    players,
  );

  if (!options.advance) return { updatedPlayers: staged, advanced: false, hasError: false };

  // Sem ganhador entre os vivos, o lote é entrada de MEIO de rodada — "matheus e joão
  // correram" enquanto a mão ainda rola. Aplicar as ações e parar por aí é o certo;
  // tentar fechar aqui só produzia um Alert de erro a cada fala parcial.
  //
  // A condição espelha a REGRA 1 de `processNextRound`: com a mesa toda estourada, não
  // há ganhador a exigir.
  const withPoints = calculatePlayerPoints(staged, initialPoints);
  const hasActivePlayers = withPoints.some((p) => p.currentPoints > 0);
  const hasWinner = staged.some((p) => p.currentAction === 'won');

  if (hasActivePlayers && !hasWinner) {
    return { updatedPlayers: staged, advanced: false, hasError: false };
  }

  const result = processNextRound(staged, withPoints);
  return { ...result, advanced: !result.hasError };
};

export const updateHistoryInList = (
  players: CachetaPlayer[],
  pId: string,
  action: CachetaAction,
  roundIdx: number,
): CachetaPlayer[] => {
  return players.map((p) => {
    const newH = [...p.history];

    // Se estamos marcando alguém como WON neste round histórico, desmarca os outros
    if (action === 'won') {
      if (p.id === pId) {
        newH[roundIdx] = 'won';
      } else if (newH[roundIdx] === 'won') {
        newH[roundIdx] = null; // Ou poderia forçar 'lost', mas null força o usuário a revisar
      }
      return { ...p, history: newH };
    }

    // Comportamento normal
    if (p.id !== pId) return p;
    newH[roundIdx] = action === newH[roundIdx] ? null : action;
    return { ...p, history: newH };
  });
};

export const removeRoundFromList = (
  players: CachetaPlayer[],
  roundIdx: number,
): CachetaPlayer[] => {
  return players.map((p) => {
    const h = [...p.history];
    h.splice(roundIdx, 1);
    return { ...p, history: h };
  });
};

export const removePlayerFromList = (players: CachetaPlayer[], pId: string): CachetaPlayer[] => {
  return players.filter((p) => p.id !== pId);
};

export const resetAllPlayers = (players: CachetaPlayer[]): CachetaPlayer[] => {
  return players.map((p) => ({ ...p, history: [], currentAction: null }));
};

// --- HOOK ---
export const useCachetaGame = (scrollRef: RefObject<ScrollView>) => {
  const [initialPoints, setInitialPoints] = useState(10);
  const [players, setPlayers] = useState<CachetaPlayer[]>([
    { id: '1', name: translate('common.player') + ' 1', history: [], currentAction: null },
    { id: '2', name: translate('common.player') + ' 2', history: [], currentAction: null },
    { id: '3', name: translate('common.player') + ' 3', history: [], currentAction: null },
  ]);

  useEffect(() => {
    const loadData = async () => {
      const saved = (await getData(STORAGE_KEYS.CACHETA_DATA)) as {
        players: CachetaPlayer[];
        initialPoints: number;
      } | null;
      if (saved) {
        setPlayers(saved.players);
        setInitialPoints(saved.initialPoints);
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    void saveData(STORAGE_KEYS.CACHETA_DATA, { players, initialPoints });
  }, [players, initialPoints]);

  const playersWithPoints = useMemo(
    () => calculatePlayerPoints(players, initialPoints),
    [players, initialPoints],
  );

  const rounds = useMemo(() => {
    if (players.length === 0) return [];
    return players[0].history.map((_, i) => ({ id: `round-${String(i)}`, index: i }));
  }, [players]);

  const handleNextRound = () => {
    const result = processNextRound(players, playersWithPoints);
    if (result.hasError) {
      // Usa a chave de erro retornada (ex: multiple_winners ou need_winner)
      Alert.alert(translate('common.error'), translate(result.errorKey ?? 'cacheta.need_winner'));
      return;
    }
    setPlayers(result.updatedPlayers);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const updateAction = (pId: string, action: CachetaAction) => {
    setPlayers((prev) => updatePlayerActionInList(prev, pId, action));
  };

  /**
   * Aplica o lote pendente da voz. Com `advance`, fecha a rodada **se houver ganhador**.
   * Devolve `true` quando o lote foi aplicado — a fila limpa mesmo sem fechar a rodada.
   */
  const applyVoiceEntries = (batch: readonly CachetaVoiceEntry[], advance: boolean): boolean => {
    const result = applyVoiceBatch(players, initialPoints, batch, { advance });
    setPlayers(result.updatedPlayers);

    if (result.hasError) {
      Alert.alert(translate('common.error'), translate(result.errorKey ?? 'cacheta.need_winner'));
      return false;
    }

    if (result.advanced) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }

    // Aplicou sem erro: a fila limpa mesmo quando a rodada não fechou, porque as ações
    // já estão visíveis no placar.
    return true;
  };

  const updateHistoryAction = (pId: string, action: CachetaAction, roundIdx: number) => {
    setPlayers((prev) => updateHistoryInList(prev, pId, action, roundIdx));
  };

  const removePlayer = (pId: string) => {
    setPlayers((prev) => removePlayerFromList(prev, pId));
  };

  const executeDeleteRound = (roundIdx: number, onCloseOverlay: () => void) => {
    setPlayers((prev) => removeRoundFromList(prev, roundIdx));
    onCloseOverlay();
  };

  const deleteRound = (roundIdx: number, onCloseOverlay: () => void) => {
    Alert.alert(translate('cacheta.delete_round'), translate('cacheta.confirm_delete_round'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.confirm'),
        style: 'destructive',
        onPress: () => {
          executeDeleteRound(roundIdx, onCloseOverlay);
        },
      },
    ]);
  };

  const handleReset = () => {
    setPlayers((prev) => resetAllPlayers(prev));
  };

  const handleAddPlayer = () => {
    setPlayers((prev) => {
      const currentRounds = prev.length > 0 ? prev[0].history.length : 0;
      const penaltyHistory: CachetaAction[] = new Array<CachetaAction>(currentRounds).fill('lost');
      return [
        ...prev,
        {
          id: Date.now().toString(),
          name: `${translate('common.player')} ${String(prev.length + 1)}`,
          history: penaltyHistory,
          currentAction: null,
        },
      ];
    });
  };

  return {
    players,
    setPlayers,
    initialPoints,
    setInitialPoints,
    playersWithPoints,
    rounds,
    handleNextRound,
    updateAction,
    applyVoiceEntries,
    updateHistoryAction,
    deleteRound,
    handleReset,
    handleAddPlayer,
    removePlayer,
  };
};
