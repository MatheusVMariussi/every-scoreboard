import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { translate } from '../i18n';
import { HistoryItem } from '../components/MatchHistoryGraph';

// --- PURE FUNCTIONS ---
export const getBasePoints = (gameMode: 'paulista' | 'mineiro') => gameMode === 'paulista' ? 1 : 2;

export const buildPointHistory = (
  currentHistory: HistoryItem[],
  team: 'us' | 'them',
  pointsToAdd: number,
  basePoints: number
): HistoryItem[] => {
  const newHist = [...currentHistory];
  if (pointsToAdd > 0) {
    newHist.push({
      id: Date.now().toString() + Math.random(),
      team,
      points: pointsToAdd,
    });
  } else {
    let foundIndex = -1;
    for (let i = newHist.length - 1; i >= 0; i--) {
      if (newHist[i].team === team) { foundIndex = i; break; }
    }
    if (foundIndex !== -1) {
      const currentPoints = newHist[foundIndex].points;
      if (currentPoints > basePoints && Math.abs(pointsToAdd) === basePoints) {
        newHist[foundIndex] = { ...newHist[foundIndex], points: currentPoints - basePoints };
      } else {
        newHist.splice(foundIndex, 1);
      }
    }
  }
  return newHist;
};

export const calculateNewScore = (currentScore: number, pointsToAdd: number, maxScore: number): { score: number; isVictory: boolean } => {
  const newScore = Math.max(0, currentScore + pointsToAdd);
  if (newScore >= maxScore && pointsToAdd > 0) {
    return { score: maxScore, isVictory: true };
  }
  return { score: newScore, isVictory: false };
};

// --- HOOK ---
export const useTrucoGame = () => {
  // --- STATES ---
  const [scoreUs, setScoreUs] = useState(0);
  const [scoreThem, setScoreThem] = useState(0);
  const [gameMode, setGameMode] = useState<'paulista' | 'mineiro'>('paulista');
  const [maxScore, setMaxScore] = useState(12);
  
  const [matchWinsUs, setMatchWinsUs] = useState(0);
  const [matchWinsThem, setMatchWinsThem] = useState(0);
  const [pointHistory, setPointHistory] = useState<HistoryItem[]>([]);
  const [nameUs, setNameUs] = useState(translate('truco.us'));
  const [nameThem, setNameThem] = useState(translate('truco.them'));
  const [isLoaded, setIsLoaded] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.TRUCO_DATA);
      if (saved) {
        setScoreUs(saved.scoreUs); setScoreThem(saved.scoreThem);
        setGameMode(saved.gameMode);
        if (saved.maxScore) setMaxScore(saved.maxScore);
        setMatchWinsUs(saved.matchWinsUs); setMatchWinsThem(saved.matchWinsThem);
        setPointHistory(saved.pointHistory); setNameUs(saved.nameUs); setNameThem(saved.nameThem);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData(STORAGE_KEYS.TRUCO_DATA, { 
        scoreUs, scoreThem, gameMode, maxScore,
        matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem 
      });
    }
  }, [scoreUs, scoreThem, gameMode, maxScore, matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem, isLoaded]);

  useEffect(() => { 
    if (isLoaded && scoreUs === 0 && scoreThem === 0) resetGame(true); 
  }, [gameMode, maxScore]);

  // --- LOGIC ---
  const resetGame = (fullReset = false) => {
    setScoreUs(0); setScoreThem(0);
    setPointHistory([]);
    if (fullReset) { setMatchWinsUs(0); setMatchWinsThem(0); }
  };

  const handleVictory = (winnerName: string, winnerTeam: 'us' | 'them') => {
    if (winnerTeam === 'us') setMatchWinsUs(prev => Math.min(prev + 1, 5));
    else setMatchWinsThem(prev => Math.min(prev + 1, 5));
    
    setTimeout(() => {
      Alert.alert(
        translate('common.game_over'), 
        translate('common.winner_text', { team: winnerName }), 
        [
            { text: translate('common.cancel'), style: "cancel" },
            { text: translate('common.new_match'), onPress: () => resetGame(false) }
        ]
      );
    }, 100);
  };

  const handlePointChange = (team: 'us' | 'them', pointsToAdd: number) => {
    const base = getBasePoints(gameMode);
    setPointHistory(prev => buildPointHistory(prev, team, pointsToAdd, base));

    const currentScore = team === 'us' ? scoreUs : scoreThem;
    const result = calculateNewScore(currentScore, pointsToAdd, maxScore);

    if (team === 'us') {
      if (result.isVictory) { handleVictory(nameUs, 'us'); }
      setScoreUs(result.score);
    } else {
      if (result.isVictory) { handleVictory(nameThem, 'them'); }
      setScoreThem(result.score);
    }
  };

  return {
    scoreUs, setScoreUs,
    scoreThem, setScoreThem,
    gameMode, setGameMode,
    maxScore, setMaxScore,
    matchWinsUs, setMatchWinsUs,
    matchWinsThem, setMatchWinsThem,
    pointHistory, setPointHistory,
    nameUs, setNameUs,
    nameThem, setNameThem,
    isLoaded,
    getBasePoints: () => getBasePoints(gameMode), resetGame, handlePointChange
  };
};