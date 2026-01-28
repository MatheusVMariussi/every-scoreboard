import { useState, useEffect, useMemo, RefObject } from 'react';
import { Alert, ScrollView } from 'react-native';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { translate } from '../i18n';

interface Player {
  id: string;
  name: string;
  lives: number;
  history: number[];
  currentBid: number;
  currentWon: number;
}

export const useFodinhaGame = (scrollRef: RefObject<ScrollView>) => {
  // --- STATES ---
  const [initialLives, setInitialLives] = useState(10);
  const [penaltyMode, setPenaltyMode] = useState<'fixed' | 'difference'>('fixed');
  const [cardsInRound, setCardsInRound] = useState(1);
  const [roundPhase, setRoundPhase] = useState<'betting' | 'results'>('betting');
  
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: translate('common.player') + ' 1', lives: 10, history: [], currentBid: 0, currentWon: 0 },
    { id: '2', name: translate('common.player') + ' 2', lives: 10, history: [], currentBid: 0, currentWon: 0 },
    { id: '3', name: translate('common.player') + ' 3', lives: 10, history: [], currentBid: 0, currentWon: 0 },
  ]);

  // --- PERSISTENCE ---
  useEffect(() => {
    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.FODINHA_DATA);
      if (saved) {
        setPlayers(saved.players);
        setInitialLives(saved.initialLives);
        setPenaltyMode(saved.penaltyMode || 'fixed');
        setCardsInRound(saved.cardsInRound || 1);
        setRoundPhase(saved.roundPhase || 'betting');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    saveData(STORAGE_KEYS.FODINHA_DATA, { players, initialLives, penaltyMode, cardsInRound, roundPhase });
  }, [players, initialLives, penaltyMode, cardsInRound, roundPhase]);

  // --- LOGIC ---
  const totalBids = useMemo(() => players.reduce((acc, p) => acc + p.currentBid, 0), [players]);
  const totalWon = useMemo(() => players.reduce((acc, p) => acc + p.currentWon, 0), [players]);

  const finishRound = () => {
    setPlayers(prev => prev.map(p => {
      if (p.lives <= 0) return p;
      const diff = Math.abs(p.currentBid - p.currentWon);
      let damage = 0;
      if (diff > 0) damage = penaltyMode === 'fixed' ? 1 : diff;

      return {
        ...p,
        lives: Math.max(0, p.lives - damage),
        history: [...p.history, damage],
        currentBid: 0,
        currentWon: 0
      };
    }));

    setCardsInRound(prev => prev + 1);
    setRoundPhase('betting');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const handlePhaseChange = () => {
    if (roundPhase === 'betting') {
      if (totalBids === cardsInRound) {
        Alert.alert(translate('fodinha.invalid_bets_title'), translate('fodinha.invalid_bets_message', { total: totalBids, cards: cardsInRound }));
        return;
      }
      setRoundPhase('results');
    } else {
      if (totalWon !== cardsInRound) {
        Alert.alert(translate('fodinha.wrong_count_title'), translate('fodinha.wrong_count_message', { total: totalWon, cards: cardsInRound }));
        return;
      }
      finishRound();
    }
  };

  const adjustValue = (playerId: string, delta: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      if (roundPhase === 'betting') {
        const newBid = Math.max(0, Math.min(cardsInRound, p.currentBid + delta));
        return { ...p, currentBid: newBid };
      } else {
        const newWon = Math.max(0, Math.min(cardsInRound, p.currentWon + delta));
        return { ...p, currentWon: newWon };
      }
    }));
  };

  const adjustHistoryDamage = (playerId: string, delta: number, roundIdx: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const newHistory = [...p.history];
      const currentDamage = newHistory[roundIdx] || 0;
      const newDamage = Math.max(0, currentDamage + delta);
      newHistory[roundIdx] = newDamage;
      const totalDamage = newHistory.reduce((a, b) => a + b, 0);
      return { ...p, history: newHistory, lives: initialLives - totalDamage };
    }));
  };

  const deleteRound = (roundIdx: number, onCloseOverlay: () => void) => {
    Alert.alert(translate('cacheta.delete_round'), translate('cacheta.confirm_delete_round'), [
        { text: translate('common.cancel'), style: 'cancel' },
        { text: translate('common.confirm'), style: 'destructive', onPress: () => {
            setPlayers(prev => prev.map(p => {
                const newHistory = [...p.history];
                newHistory.splice(roundIdx, 1);
                const totalDamage = newHistory.reduce((a, b) => a + b, 0);
                return { ...p, history: newHistory, lives: initialLives - totalDamage };
            }));
            onCloseOverlay();
        }}
    ]);
  };

  const handleReset = () => {
    setPlayers(prev => prev.map(p => ({ ...p, lives: initialLives, history: [], currentBid: 0, currentWon: 0 })));
    setCardsInRound(1);
    setRoundPhase('betting');
  };

  const handleAddPlayer = () => {
    setPlayers(prev => {
        const currentRounds = prev.length > 0 ? prev[0].history.length : 0;
        return [...prev, { 
            id: Date.now().toString(), 
            name: `${translate('common.player')} ${prev.length + 1}`,
            lives: initialLives, 
            history: new Array(currentRounds).fill(0), 
            currentBid: 0, 
            currentWon: 0 
        }];
    });
  };

  return {
    players, setPlayers,
    initialLives, setInitialLives,
    penaltyMode, setPenaltyMode,
    cardsInRound, setCardsInRound,
    roundPhase, setRoundPhase,
    totalBids, totalWon,
    handlePhaseChange, adjustValue, adjustHistoryDamage, deleteRound,
    handleReset, handleAddPlayer
  };
};