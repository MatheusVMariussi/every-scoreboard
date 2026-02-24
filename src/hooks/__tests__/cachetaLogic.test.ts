import {
  processNextRound,
  updatePlayerActionInList,
  updateHistoryInList,
  removeRoundFromList,
  removePlayerFromList,
  resetAllPlayers,
  type CachetaPlayer,
} from '../useCachetaGame';

const makePlayer = (overrides: Partial<CachetaPlayer> = {}): CachetaPlayer => ({
  id: '1',
  name: 'Player 1',
  history: [],
  currentAction: null,
  ...overrides,
});

// --- processNextRound ---

describe('processNextRound', () => {
  it('processes a valid round with exactly 1 winner', () => {
    const players = [
      makePlayer({ id: '1', currentAction: 'won' }),
      makePlayer({ id: '2', currentAction: 'lost' }),
      makePlayer({ id: '3', currentAction: 'fold' }),
    ];
    const withPoints = players.map((p) => ({ ...p, currentPoints: 10 }));

    const result = processNextRound(players, withPoints);

    expect(result.hasError).toBe(false);
    expect(result.updatedPlayers[0].history).toEqual(['won']);
    expect(result.updatedPlayers[1].history).toEqual(['lost']);
    expect(result.updatedPlayers[2].history).toEqual(['fold']);
    // currentAction should be reset to null
    result.updatedPlayers.forEach((p) => {
      expect(p.currentAction).toBeNull();
    });
  });

  it('returns error when no winners among active players', () => {
    const players = [
      makePlayer({ id: '1', currentAction: 'fold' }),
      makePlayer({ id: '2', currentAction: 'lost' }),
    ];
    const withPoints = players.map((p) => ({ ...p, currentPoints: 10 }));

    const result = processNextRound(players, withPoints);

    expect(result.hasError).toBe(true);
    expect(result.errorKey).toBe('cacheta.need_winner');
  });

  it('returns error when multiple winners', () => {
    const players = [
      makePlayer({ id: '1', currentAction: 'won' }),
      makePlayer({ id: '2', currentAction: 'won' }),
    ];
    const withPoints = players.map((p) => ({ ...p, currentPoints: 10 }));

    const result = processNextRound(players, withPoints);

    expect(result.hasError).toBe(true);
    expect(result.errorKey).toBe('cacheta.multiple_winners');
  });

  it('defaults null action to lost for alive players', () => {
    const players = [
      makePlayer({ id: '1', currentAction: 'won' }),
      makePlayer({ id: '2', currentAction: null }),
    ];
    const withPoints = [
      { ...players[0], currentPoints: 10 },
      { ...players[1], currentPoints: 5 },
    ];

    const result = processNextRound(players, withPoints);

    expect(result.hasError).toBe(false);
    expect(result.updatedPlayers[1].history).toEqual(['lost']);
  });

  it('skips action defaulting for eliminated players (0 points)', () => {
    const players = [
      makePlayer({ id: '1', currentAction: 'won' }),
      makePlayer({ id: '2', currentAction: null }),
    ];
    const withPoints = [
      { ...players[0], currentPoints: 10 },
      { ...players[1], currentPoints: 0 },
    ];

    const result = processNextRound(players, withPoints);

    expect(result.hasError).toBe(false);
    // Eliminated player keeps null action in history
    expect(result.updatedPlayers[1].history).toEqual([null]);
  });
});

// --- updatePlayerActionInList ---

describe('updatePlayerActionInList', () => {
  it('sets action on target player', () => {
    const players = [makePlayer({ id: '1' }), makePlayer({ id: '2' })];
    const result = updatePlayerActionInList(players, '1', 'fold');
    expect(result[0].currentAction).toBe('fold');
    expect(result[1].currentAction).toBeNull();
  });

  it('toggles off same action', () => {
    const players = [makePlayer({ id: '1', currentAction: 'fold' })];
    const result = updatePlayerActionInList(players, '1', 'fold');
    expect(result[0].currentAction).toBeNull();
  });

  it('setting won clears other won players', () => {
    const players = [
      makePlayer({ id: '1', currentAction: 'won' }),
      makePlayer({ id: '2', currentAction: null }),
    ];
    const result = updatePlayerActionInList(players, '2', 'won');
    expect(result[0].currentAction).toBeNull();
    expect(result[1].currentAction).toBe('won');
  });

  it('setting won on already-won player keeps it', () => {
    const players = [makePlayer({ id: '1', currentAction: 'won' })];
    const result = updatePlayerActionInList(players, '1', 'won');
    expect(result[0].currentAction).toBe('won');
  });
});

// --- updateHistoryInList ---

describe('updateHistoryInList', () => {
  it('edits a historical round action', () => {
    const players = [makePlayer({ id: '1', history: ['won', 'lost'] })];
    const result = updateHistoryInList(players, '1', 'fold', 1);
    expect(result[0].history).toEqual(['won', 'fold']);
  });

  it('toggles off same historical action', () => {
    const players = [makePlayer({ id: '1', history: ['fold'] })];
    const result = updateHistoryInList(players, '1', 'fold', 0);
    expect(result[0].history).toEqual([null]);
  });

  it('setting won in history clears other won in same round', () => {
    const players = [
      makePlayer({ id: '1', history: ['won'] }),
      makePlayer({ id: '2', history: ['lost'] }),
    ];
    const result = updateHistoryInList(players, '2', 'won', 0);
    expect(result[0].history).toEqual([null]);
    expect(result[1].history).toEqual(['won']);
  });
});

// --- removeRoundFromList ---

describe('removeRoundFromList', () => {
  it('removes the correct round from all players', () => {
    const players = [
      makePlayer({ id: '1', history: ['won', 'fold', 'lost'] }),
      makePlayer({ id: '2', history: ['lost', 'won', 'fold'] }),
    ];
    const result = removeRoundFromList(players, 1);
    expect(result[0].history).toEqual(['won', 'lost']);
    expect(result[1].history).toEqual(['lost', 'fold']);
  });
});

// --- removePlayerFromList ---

describe('removePlayerFromList', () => {
  it('removes the player with matching id', () => {
    const players = [makePlayer({ id: '1' }), makePlayer({ id: '2' })];
    const result = removePlayerFromList(players, '1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

// --- resetAllPlayers ---

describe('resetAllPlayers', () => {
  it('clears history and currentAction for all players', () => {
    const players = [
      makePlayer({ id: '1', history: ['won', 'fold'], currentAction: 'lost' }),
      makePlayer({ id: '2', history: ['lost'], currentAction: 'won' }),
    ];
    const result = resetAllPlayers(players);
    result.forEach((p) => {
      expect(p.history).toEqual([]);
      expect(p.currentAction).toBeNull();
    });
    // Names and ids should be preserved
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });
});
