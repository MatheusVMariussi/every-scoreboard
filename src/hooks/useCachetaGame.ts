import { useState, useEffect, useMemo, RefObject } from 'react';
import { Alert, ScrollView } from 'react-native';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { translate } from '../i18n';

type Action = 'won' | 'fold' | 'lost' | null;

interface Player {
  id: string;
  name: string;
  history: Action[];
  currentAction: Action;
}

export const useCachetaGame = (scrollRef: RefObject<ScrollView>) => {
  // --- STATES ---
  const [initialPoints, setInitialPoints] = useState(10);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: translate('common.player') + ' 1', history: [], currentAction: null },
    { id: '2', name: translate('common.player') + ' 2', history: [], currentAction: null },
    { id: '3', name: translate('common.player') + ' 3', history: [], currentAction: null },
  ]);

  // --- PERSISTENCE ---
  useEffect(() => {
    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.CACHETA_DATA);
      if (saved) {
        setPlayers(saved.players);
        setInitialPoints(saved.initialPoints);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    saveData(STORAGE_KEYS.CACHETA_DATA, { players, initialPoints });
  }, [players, initialPoints]);

  // --- LOGIC ---
  const playersWithPoints = useMemo(() => {
    return players.map(p => {
      let pts = initialPoints;
      p.history.forEach(act => {
        if (act === 'fold') pts -= 1;
        if (act === 'lost') pts -= 2;
      });
      return { ...p, currentPoints: Math.max(0, pts) };
    });
  }, [players, initialPoints]);

  const handleNextRound = () => {
    const playersToUpdate = players.map((p, idx) => {
        const pWithPts = playersWithPoints[idx]; 
        if (pWithPts.currentPoints > 0 && p.currentAction === null) {
            return { ...p, currentAction: 'lost' as Action };
        }
        return p;
    });

    const hasWinner = playersToUpdate.some(p => p.currentAction === 'won');
    const alive = playersWithPoints.filter(p => p.currentPoints > 0);

    if (!hasWinner && alive.length > 0) {
      Alert.alert(translate('common.error'), translate('cacheta.need_winner'));
      return;
    }

    setPlayers(prev => playersToUpdate.map(p => ({
      ...p,
      history: [...p.history, p.currentAction],
      currentAction: null
    })));

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const updateAction = (pId: string, action: Action) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== pId) return p;
      return { ...p, currentAction: action === p.currentAction ? null : action };
    }));
  };
  
  const updateHistoryAction = (pId: string, action: Action, roundIdx: number) => {
      setPlayers(prev => prev.map(p => {
          if (p.id !== pId) return p;
          const newH = [...p.history];
          newH[roundIdx] = action === newH[roundIdx] ? null : action;
          return { ...p, history: newH };
      }));
  };

  const deleteRound = (roundIdx: number, onCloseOverlay: () => void) => {
      Alert.alert(translate('cacheta.delete_round'), translate('cacheta.confirm_delete_round'), [
          { text: translate('common.cancel'), style: 'cancel' },
          { text: translate('common.confirm'), style: 'destructive', onPress: () => {
              setPlayers(prev => prev.map(p => { 
                  const h = [...p.history]; 
                  h.splice(roundIdx, 1); 
                  return { ...p, history: h }; 
              }));
              onCloseOverlay();
          }}
      ]);
  };

  const handleReset = () => {
    setPlayers(prev => prev.map(p => ({ ...p, history: [], currentAction: null })));
  };

  const handleAddPlayer = () => {
    setPlayers(prev => {
      const currentRounds = prev.length > 0 ? prev[0].history.length : 0;
      const penaltyHistory: Action[] = new Array(currentRounds).fill('lost');
      return [...prev, { 
        id: Date.now().toString(), 
        name: `${translate('common.player')} ${prev.length + 1}`,
        history: penaltyHistory, 
        currentAction: null 
      }];
    });
  };

  return {
    players, setPlayers,
    initialPoints, setInitialPoints,
    playersWithPoints,
    handleNextRound, updateAction, updateHistoryAction, deleteRound,
    handleReset, handleAddPlayer
  };
};