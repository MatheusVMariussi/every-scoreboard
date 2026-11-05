import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { getData, STORAGE_KEYS } from '../utils/storage';
import { intInRange, isRecord, nonBlankString, oneOf } from '../utils/parse';
import { useAutoSave } from './useAutoSave';
import { translate } from '../i18n';
import { type HistoryItem } from '../components/MatchHistoryGraph';

// --- PURE FUNCTIONS ---
export const getBasePoints = (gameMode: 'paulista' | 'mineiro') =>
  gameMode === 'paulista' ? 1 : 2;

export const buildPointHistory = (
  currentHistory: HistoryItem[],
  team: 'us' | 'them',
  pointsToAdd: number,
  basePoints: number,
): HistoryItem[] => {
  const newHist = [...currentHistory];
  if (pointsToAdd > 0) {
    newHist.push({
      id: Date.now().toString() + String(Math.random()),
      team,
      points: pointsToAdd,
    });
  } else {
    let foundIndex = -1;
    for (let i = newHist.length - 1; i >= 0; i--) {
      if (newHist[i].team === team) {
        foundIndex = i;
        break;
      }
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

/**
 * Vitória é cruzar a linha de chegada: quem já estava na pontuação máxima (o aviso de fim
 * de jogo foi fechado) não ganha outro troféu com mais um ponto.
 */
export const calculateNewScore = (
  currentScore: number,
  pointsToAdd: number,
  maxScore: number,
): { score: number; isVictory: boolean } => {
  const newScore = Math.max(0, currentScore + pointsToAdd);
  if (newScore >= maxScore && pointsToAdd > 0) {
    return { score: maxScore, isVictory: currentScore < maxScore };
  }
  return { score: newScore, isVictory: false };
};

// --- PERSISTENCE ---

type GameMode = 'paulista' | 'mineiro';

const GAME_MODES: readonly GameMode[] = ['paulista', 'mineiro'];
const DEFAULT_MAX_SCORE = 12;
/** Troféus mostrados por time: a contagem para aqui. */
const MAX_MATCH_WINS = 5;

export interface TrucoSave {
  scoreUs: number;
  scoreThem: number;
  gameMode: GameMode;
  maxScore: number;
  matchWinsUs: number;
  matchWinsThem: number;
  pointHistory: HistoryItem[];
  nameUs: string;
  nameThem: string;
}

const parseHistoryItem = (raw: unknown): HistoryItem | null => {
  if (!isRecord(raw) || typeof raw.id !== 'string') return null;
  if (raw.team !== 'us' && raw.team !== 'them') return null;
  if (typeof raw.points !== 'number' || !Number.isInteger(raw.points) || raw.points <= 0) {
    return null;
  }
  return { id: raw.id, team: raw.team, points: raw.points };
};

const isHistoryItem = (item: HistoryItem | null): item is HistoryItem => item !== null;

/**
 * Valida o que veio do disco campo a campo: o que não der para confiar volta ao padrão.
 * Saves de antes da pontuação máxima não têm o campo e viram jogo de 12; entradas do
 * gráfico que não dá para desenhar são descartadas. Devolve `null` quando nem é um save.
 */
export const parseTrucoSave = (raw: unknown): TrucoSave | null => {
  if (!isRecord(raw)) return null;

  // Só existem jogos de 12 e de 24.
  const maxScore = raw.maxScore === 24 ? 24 : DEFAULT_MAX_SCORE;

  return {
    scoreUs: intInRange(raw.scoreUs, 0, maxScore, 0),
    scoreThem: intInRange(raw.scoreThem, 0, maxScore, 0),
    gameMode: oneOf(raw.gameMode, GAME_MODES, 'paulista'),
    maxScore,
    matchWinsUs: intInRange(raw.matchWinsUs, 0, MAX_MATCH_WINS, 0),
    matchWinsThem: intInRange(raw.matchWinsThem, 0, MAX_MATCH_WINS, 0),
    pointHistory: Array.isArray(raw.pointHistory)
      ? raw.pointHistory.map(parseHistoryItem).filter(isHistoryItem)
      : [],
    nameUs: nonBlankString(raw.nameUs, translate('truco.us')),
    nameThem: nonBlankString(raw.nameThem, translate('truco.them')),
  };
};

// --- HOOK ---
export const useTrucoGame = () => {
  // --- STATES ---
  const [scoreUs, setScoreUs] = useState(0);
  const [scoreThem, setScoreThem] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('paulista');
  const [maxScore, setMaxScore] = useState(DEFAULT_MAX_SCORE);

  const [matchWinsUs, setMatchWinsUs] = useState(0);
  const [matchWinsThem, setMatchWinsThem] = useState(0);
  const [pointHistory, setPointHistory] = useState<HistoryItem[]>([]);
  const [nameUs, setNameUs] = useState(translate('truco.us'));
  const [nameThem, setNameThem] = useState(translate('truco.them'));
  const [isLoaded, setIsLoaded] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    let active = true;
    void getData(STORAGE_KEYS.TRUCO_DATA).then((raw) => {
      if (!active) return;
      const saved = parseTrucoSave(raw);
      if (saved) {
        setScoreUs(saved.scoreUs);
        setScoreThem(saved.scoreThem);
        setGameMode(saved.gameMode);
        setMaxScore(saved.maxScore);
        setMatchWinsUs(saved.matchWinsUs);
        setMatchWinsThem(saved.matchWinsThem);
        setPointHistory(saved.pointHistory);
        setNameUs(saved.nameUs);
        setNameThem(saved.nameThem);
      }
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const snapshot = useMemo<TrucoSave>(
    () => ({
      scoreUs,
      scoreThem,
      gameMode,
      maxScore,
      matchWinsUs,
      matchWinsThem,
      pointHistory,
      nameUs,
      nameThem,
    }),
    [
      scoreUs,
      scoreThem,
      gameMode,
      maxScore,
      matchWinsUs,
      matchWinsThem,
      pointHistory,
      nameUs,
      nameThem,
    ],
  );
  useAutoSave(STORAGE_KEYS.TRUCO_DATA, snapshot, isLoaded);

  // --- LOGIC ---
  const resetGame = (fullReset = false) => {
    setScoreUs(0);
    setScoreThem(0);
    setPointHistory([]);
    if (fullReset) {
      setMatchWinsUs(0);
      setMatchWinsThem(0);
    }
  };

  /**
   * Trocar o modo ou a pontuação máxima com o placar zerado começa uma série nova, e os
   * troféus zeram. Com um jogo em andamento só a regra muda.
   *
   * Isto era um efeito que observava o placar: toda vez que ele voltava a 0 x 0 — como
   * logo depois de "Nova Partida" — os troféus eram apagados.
   */
  const changeGameMode = (mode: GameMode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    if (scoreUs === 0 && scoreThem === 0) resetGame(true);
  };

  const changeMaxScore = (score: number) => {
    if (score === maxScore) return;
    setMaxScore(score);
    if (scoreUs === 0 && scoreThem === 0) resetGame(true);
  };

  const handleVictory = (winnerName: string, winnerTeam: 'us' | 'them') => {
    if (winnerTeam === 'us') setMatchWinsUs((prev) => Math.min(prev + 1, MAX_MATCH_WINS));
    else setMatchWinsThem((prev) => Math.min(prev + 1, MAX_MATCH_WINS));

    setTimeout(() => {
      Alert.alert(
        translate('common.game_over'),
        translate('common.winner_text', { team: winnerName }),
        [
          { text: translate('common.cancel'), style: 'cancel' },
          {
            text: translate('common.new_match'),
            onPress: () => {
              resetGame(false);
            },
          },
        ],
      );
    }, 100);
  };

  const handlePointChange = (team: 'us' | 'them', pointsToAdd: number) => {
    const base = getBasePoints(gameMode);
    setPointHistory((prev) => buildPointHistory(prev, team, pointsToAdd, base));

    const currentScore = team === 'us' ? scoreUs : scoreThem;
    const result = calculateNewScore(currentScore, pointsToAdd, maxScore);

    if (team === 'us') {
      if (result.isVictory) {
        handleVictory(nameUs, 'us');
      }
      setScoreUs(result.score);
    } else {
      if (result.isVictory) {
        handleVictory(nameThem, 'them');
      }
      setScoreThem(result.score);
    }
  };

  return {
    scoreUs,
    setScoreUs,
    scoreThem,
    setScoreThem,
    gameMode,
    changeGameMode,
    maxScore,
    changeMaxScore,
    matchWinsUs,
    setMatchWinsUs,
    matchWinsThem,
    setMatchWinsThem,
    pointHistory,
    setPointHistory,
    nameUs,
    setNameUs,
    nameThem,
    setNameThem,
    isLoaded,
    getBasePoints: () => getBasePoints(gameMode),
    resetGame,
    handlePointChange,
  };
};
