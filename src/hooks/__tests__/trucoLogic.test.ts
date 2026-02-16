import { getBasePoints, buildPointHistory, calculateNewScore } from '../useTrucoGame';
import { HistoryItem } from '../../components/MatchHistoryGraph';

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

  it('works with maxScore of 24', () => {
    const result = calculateNewScore(22, 3, 24);
    expect(result.score).toBe(24);
    expect(result.isVictory).toBe(true);
  });
});
