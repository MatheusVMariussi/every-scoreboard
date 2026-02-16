import {
  logicFinishRound,
  logicUpdateValue,
  logicUpdateHistoryDamage,
  logicRemoveRound,
  logicRemovePlayer,
  FodinhaPlayer,
} from '../useFodinhaGame';

const makePlayer = (overrides: Partial<FodinhaPlayer> = {}): FodinhaPlayer => ({
  id: '1',
  name: 'Player 1',
  lives: 10,
  history: [],
  currentBid: 0,
  currentWon: 0,
  ...overrides,
});

// --- logicFinishRound ---

describe('logicFinishRound', () => {
  describe('fixed penalty mode', () => {
    it('no damage when bid matches won', () => {
      const players = [makePlayer({ currentBid: 2, currentWon: 2 })];
      const result = logicFinishRound(players, 'fixed');
      expect(result[0].lives).toBe(10);
      expect(result[0].history).toEqual([0]);
    });

    it('1 damage regardless of miss amount', () => {
      const players = [makePlayer({ currentBid: 0, currentWon: 3 })];
      const result = logicFinishRound(players, 'fixed');
      expect(result[0].lives).toBe(9);
      expect(result[0].history).toEqual([1]);
    });

    it('resets currentBid and currentWon after round', () => {
      const players = [makePlayer({ currentBid: 2, currentWon: 1 })];
      const result = logicFinishRound(players, 'fixed');
      expect(result[0].currentBid).toBe(0);
      expect(result[0].currentWon).toBe(0);
    });

    it('skips dead players (lives <= 0)', () => {
      const players = [makePlayer({ lives: 0, currentBid: 1, currentWon: 3 })];
      const result = logicFinishRound(players, 'fixed');
      expect(result[0].lives).toBe(0);
      expect(result[0].history).toEqual([]);
    });
  });

  describe('difference penalty mode', () => {
    it('damage equals absolute difference between bid and won', () => {
      const players = [makePlayer({ currentBid: 1, currentWon: 4 })];
      const result = logicFinishRound(players, 'difference');
      expect(result[0].lives).toBe(7); // 10 - 3
      expect(result[0].history).toEqual([3]);
    });

    it('damage when bid is higher than won', () => {
      const players = [makePlayer({ currentBid: 5, currentWon: 2 })];
      const result = logicFinishRound(players, 'difference');
      expect(result[0].lives).toBe(7); // 10 - 3
    });

    it('lives do not go below 0', () => {
      const players = [makePlayer({ lives: 2, currentBid: 0, currentWon: 5 })];
      const result = logicFinishRound(players, 'difference');
      expect(result[0].lives).toBe(0);
    });
  });

  it('handles multiple players in one round', () => {
    const players = [
      makePlayer({ id: '1', currentBid: 2, currentWon: 2 }), // exact
      makePlayer({ id: '2', currentBid: 1, currentWon: 0 }), // missed by 1
      makePlayer({ id: '3', lives: 0, currentBid: 0, currentWon: 0 }), // dead
    ];
    const result = logicFinishRound(players, 'fixed');
    expect(result[0].lives).toBe(10); // no damage
    expect(result[1].lives).toBe(9);  // 1 damage
    expect(result[2].lives).toBe(0);  // untouched
  });
});

// --- logicUpdateValue ---

describe('logicUpdateValue', () => {
  it('increments bid in betting phase', () => {
    const players = [makePlayer({ id: '1', currentBid: 1 })];
    const result = logicUpdateValue(players, '1', 1, 'betting', 5);
    expect(result[0].currentBid).toBe(2);
  });

  it('clamps bid to 0 minimum', () => {
    const players = [makePlayer({ id: '1', currentBid: 0 })];
    const result = logicUpdateValue(players, '1', -1, 'betting', 5);
    expect(result[0].currentBid).toBe(0);
  });

  it('clamps bid to cardsInRound maximum', () => {
    const players = [makePlayer({ id: '1', currentBid: 3 })];
    const result = logicUpdateValue(players, '1', 1, 'betting', 3);
    expect(result[0].currentBid).toBe(3);
  });

  it('increments won in results phase', () => {
    const players = [makePlayer({ id: '1', currentWon: 0 })];
    const result = logicUpdateValue(players, '1', 1, 'results', 5);
    expect(result[0].currentWon).toBe(1);
  });

  it('clamps won to cardsInRound maximum', () => {
    const players = [makePlayer({ id: '1', currentWon: 4 })];
    const result = logicUpdateValue(players, '1', 1, 'results', 4);
    expect(result[0].currentWon).toBe(4);
  });

  it('does not modify other players', () => {
    const players = [
      makePlayer({ id: '1', currentBid: 0 }),
      makePlayer({ id: '2', currentBid: 2 }),
    ];
    const result = logicUpdateValue(players, '1', 1, 'betting', 5);
    expect(result[0].currentBid).toBe(1);
    expect(result[1].currentBid).toBe(2);
  });
});

// --- logicUpdateHistoryDamage ---

describe('logicUpdateHistoryDamage', () => {
  it('increases damage for a round and recalculates lives', () => {
    const players = [makePlayer({ id: '1', lives: 8, history: [2, 0] })];
    const result = logicUpdateHistoryDamage(players, '1', 1, 1, 10);
    expect(result[0].history).toEqual([2, 1]);
    expect(result[0].lives).toBe(7); // 10 - 2 - 1
  });

  it('does not allow negative damage', () => {
    const players = [makePlayer({ id: '1', lives: 10, history: [0] })];
    const result = logicUpdateHistoryDamage(players, '1', -1, 0, 10);
    expect(result[0].history).toEqual([0]);
    expect(result[0].lives).toBe(10);
  });

  it('recalculates lives from total history damage', () => {
    const players = [makePlayer({ id: '1', lives: 5, history: [3, 2] })];
    const result = logicUpdateHistoryDamage(players, '1', -1, 0, 10);
    // history[0] goes from 3 to 2, total = 2+2 = 4, lives = 10-4 = 6
    expect(result[0].history).toEqual([2, 2]);
    expect(result[0].lives).toBe(6);
  });
});

// --- logicRemoveRound ---

describe('logicRemoveRound', () => {
  it('removes round and recalculates lives', () => {
    const players = [makePlayer({ id: '1', lives: 5, history: [3, 2] })];
    const result = logicRemoveRound(players, 0, 10);
    expect(result[0].history).toEqual([2]);
    expect(result[0].lives).toBe(8); // 10 - 2
  });

  it('removing last round restores full lives', () => {
    const players = [makePlayer({ id: '1', lives: 7, history: [3] })];
    const result = logicRemoveRound(players, 0, 10);
    expect(result[0].history).toEqual([]);
    expect(result[0].lives).toBe(10);
  });
});

// --- logicRemovePlayer ---

describe('logicRemovePlayer', () => {
  it('removes the player with matching id', () => {
    const players = [makePlayer({ id: '1' }), makePlayer({ id: '2' })];
    const result = logicRemovePlayer(players, '1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});
