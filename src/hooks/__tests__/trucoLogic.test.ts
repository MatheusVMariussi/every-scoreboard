import {
  getBasePoints,
  buildPointHistory,
  calculateNewScore,
  parseTrucoSave,
} from '../useTrucoGame';
import { translate } from '../../i18n';
import { type HistoryItem } from '../../components/MatchHistoryGraph';

// --- getBasePoints ---

describe('getBasePoints', () => {
  it('returns 1 for paulista', () => {
    expect(getBasePoints('paulista')).toBe(1);
  });

  it('returns 2 for mineiro', () => {
    expect(getBasePoints('mineiro')).toBe(2);
  });
});

// --- buildPointHistory ---

describe('buildPointHistory', () => {
  const makeItem = (team: 'us' | 'them', points: number): HistoryItem => ({
    id: 'test',
    team,
    points,
  });

  it('appends new entry when adding positive points', () => {
    const history: HistoryItem[] = [];
    const result = buildPointHistory(history, 'us', 3, 1);
    expect(result).toHaveLength(1);
    expect(result[0].team).toBe('us');
    expect(result[0].points).toBe(3);
  });

  it('removes last entry for team when subtracting base points from single-base entry', () => {
    const history = [makeItem('us', 1)];
    const result = buildPointHistory(history, 'us', -1, 1);
    expect(result).toHaveLength(0);
  });

  it('reduces multi-point entry by base when subtracting', () => {
    const history = [makeItem('us', 3)];
    const result = buildPointHistory(history, 'us', -1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].points).toBe(2);
  });

  it('finds the last entry for the correct team', () => {
    const history = [makeItem('us', 1), makeItem('them', 3), makeItem('us', 4)];
    const result = buildPointHistory(history, 'us', -1, 1);
    // Should reduce the last 'us' entry (4 -> 3), not the first
    expect(result).toHaveLength(3);
    expect(result[2].points).toBe(3);
  });

  it('does nothing when subtracting from empty history', () => {
    const result = buildPointHistory([], 'us', -1, 1);
    expect(result).toHaveLength(0);
  });

  it('does nothing when subtracting from team with no entries', () => {
    const history = [makeItem('them', 3)];
    const result = buildPointHistory(history, 'us', -1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].team).toBe('them');
  });

  it('removes entry when points equal base (mineiro base=2)', () => {
    const history = [makeItem('us', 2)];
    const result = buildPointHistory(history, 'us', -2, 2);
    expect(result).toHaveLength(0);
  });

  it('reduces entry when points > base (mineiro base=2)', () => {
    const history = [makeItem('us', 4)];
    const result = buildPointHistory(history, 'us', -2, 2);
    expect(result).toHaveLength(1);
    expect(result[0].points).toBe(2);
  });

  it('does not mutate the original array', () => {
    const history = [makeItem('us', 3)];
    const original = [...history];
    buildPointHistory(history, 'us', 1, 1);
    expect(history).toEqual(original);
  });
});

// --- calculateNewScore ---

describe('calculateNewScore', () => {
  it('adds points normally', () => {
    const result = calculateNewScore(5, 3, 12);
    expect(result.score).toBe(8);
    expect(result.isVictory).toBe(false);
  });

  it('clamps score to 0 when subtracting below zero', () => {
    const result = calculateNewScore(2, -5, 12);
    expect(result.score).toBe(0);
    expect(result.isVictory).toBe(false);
  });

  it('triggers victory when reaching maxScore', () => {
    const result = calculateNewScore(10, 3, 12);
    expect(result.score).toBe(12);
    expect(result.isVictory).toBe(true);
  });

  it('triggers victory when exceeding maxScore', () => {
    const result = calculateNewScore(11, 3, 12);
    expect(result.score).toBe(12);
    expect(result.isVictory).toBe(true);
  });

  it('does not trigger victory when subtracting even if score is at max', () => {
    const result = calculateNewScore(12, -1, 12);
    expect(result.score).toBe(11);
    expect(result.isVictory).toBe(false);
  });

  it('does not count a second victory for a team already at maxScore', () => {
    // Fechar o aviso de fim de jogo deixa o placar em 12; um toque a mais no vencedor
    // não pode render outro troféu.
    const result = calculateNewScore(12, 1, 12);
    expect(result.score).toBe(12);
    expect(result.isVictory).toBe(false);
  });

  it('works with maxScore of 24', () => {
    const result = calculateNewScore(22, 3, 24);
    expect(result.score).toBe(24);
    expect(result.isVictory).toBe(true);
  });
});

// --- parseTrucoSave ---

describe('parseTrucoSave', () => {
  const validSave = {
    scoreUs: 7,
    scoreThem: 3,
    gameMode: 'mineiro',
    maxScore: 24,
    matchWinsUs: 2,
    matchWinsThem: 1,
    pointHistory: [
      { id: 'a', team: 'us', points: 4 },
      { id: 'b', team: 'them', points: 2 },
    ],
    nameUs: 'Nós',
    nameThem: 'Eles',
  };

  it('reads a valid save as it was stored', () => {
    expect(parseTrucoSave(validSave)).toEqual(validSave);
  });

  it('reads a save from before the max score setting as a 12-point game', () => {
    expect(parseTrucoSave({ ...validSave, maxScore: undefined })?.maxScore).toBe(12);
  });

  it('falls back to the default of each field it cannot trust', () => {
    const save = parseTrucoSave({
      ...validSave,
      scoreUs: -1,
      scoreThem: 'abc',
      gameMode: 'carioca',
      maxScore: 13,
      matchWinsUs: 9,
      matchWinsThem: 1.5,
      nameUs: '  ',
      nameThem: 42,
    });
    expect(save).toEqual({
      ...validSave,
      scoreUs: 0,
      scoreThem: 0,
      gameMode: 'paulista',
      maxScore: 12,
      matchWinsUs: 0,
      matchWinsThem: 0,
      nameUs: translate('truco.us'),
      nameThem: translate('truco.them'),
    });
  });

  it('does not trust a score above the max score', () => {
    expect(parseTrucoSave({ ...validSave, maxScore: 12, scoreUs: 20 })?.scoreUs).toBe(0);
  });

  it('drops the history entries it cannot draw and keeps the rest', () => {
    const save = parseTrucoSave({
      ...validSave,
      pointHistory: [
        { id: 'a', team: 'us', points: 4 },
        { id: 'b', team: 'nobody', points: 1 },
        { id: 'c', team: 'them', points: 0 },
        { team: 'us', points: 1 },
        'junk',
      ],
    });
    expect(save?.pointHistory).toEqual([{ id: 'a', team: 'us', points: 4 }]);
  });

  it('starts an empty history when the stored one is not a list', () => {
    expect(parseTrucoSave({ ...validSave, pointHistory: 'nope' })?.pointHistory).toEqual([]);
  });

  it('rejects data that is not a save', () => {
    expect(parseTrucoSave(null)).toBeNull();
    expect(parseTrucoSave('oops')).toBeNull();
    expect(parseTrucoSave([validSave])).toBeNull();
  });
});
