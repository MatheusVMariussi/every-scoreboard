import {
  applyVoiceBatch,
  calculatePlayerPoints,
  setPlayerActionInList,
  updatePlayerActionInList,
  type CachetaPlayer,
} from '../useCachetaGame';

const makePlayer = (overrides: Partial<CachetaPlayer> = {}): CachetaPlayer => ({
  id: '1',
  name: 'Player 1',
  history: [],
  currentAction: null,
  ...overrides,
});

const table = (): CachetaPlayer[] => [
  makePlayer({ id: '1', name: 'Léo' }),
  makePlayer({ id: '2', name: 'Ana' }),
  makePlayer({ id: '3', name: 'Tião' }),
];

// --- calculatePlayerPoints ---

describe('calculatePlayerPoints', () => {
  it('charges 1 for a fold and 2 for a loss, and nothing for a win', () => {
    const players = [
      makePlayer({ id: '1', history: ['fold', 'fold'] }),
      makePlayer({ id: '2', history: ['lost'] }),
      makePlayer({ id: '3', history: ['won', 'won'] }),
    ];

    const result = calculatePlayerPoints(players, 10);

    expect(result[0].currentPoints).toBe(8);
    expect(result[1].currentPoints).toBe(8);
    expect(result[2].currentPoints).toBe(10);
  });

  it('never goes below zero', () => {
    const players = [makePlayer({ history: ['lost', 'lost', 'lost'] })];
    expect(calculatePlayerPoints(players, 2)[0].currentPoints).toBe(0);
  });
});

// --- setPlayerActionInList ---

describe('setPlayerActionInList', () => {
  it('sets absolutely where updatePlayerActionInList would toggle it off', () => {
    const players = [makePlayer({ id: '1', currentAction: 'fold' })];

    // Este é o bug que a versão absoluta evita: repetir a mesma ação limparia o valor.
    expect(updatePlayerActionInList(players, '1', 'fold')[0].currentAction).toBeNull();
    expect(setPlayerActionInList(players, '1', 'fold')[0].currentAction).toBe('fold');
  });

  it('still enforces a single winner', () => {
    const players = [
      makePlayer({ id: '1', currentAction: 'won' }),
      makePlayer({ id: '2', currentAction: null }),
    ];

    const result = setPlayerActionInList(players, '2', 'won');

    expect(result[0].currentAction).toBeNull();
    expect(result[1].currentAction).toBe('won');
  });
});

// --- applyVoiceBatch ---

describe('applyVoiceBatch', () => {
  it('stages actions without advancing when advance is false', () => {
    const result = applyVoiceBatch(
      table(),
      10,
      [
        { playerId: '1', action: 'fold' },
        { playerId: '2', action: 'won' },
      ],
      { advance: false },
    );

    expect(result.hasError).toBe(false);
    expect(result.updatedPlayers[0].currentAction).toBe('fold');
    expect(result.updatedPlayers[1].currentAction).toBe('won');
    // Nada foi para o histórico ainda.
    expect(result.updatedPlayers[0].history).toEqual([]);
  });

  it('applies and advances, auto-filling everyone else as lost', () => {
    const result = applyVoiceBatch(table(), 10, [{ playerId: '2', action: 'won' }], {
      advance: true,
    });

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(true);
    expect(result.updatedPlayers[0].history).toEqual(['lost']);
    expect(result.updatedPlayers[1].history).toEqual(['won']);
    expect(result.updatedPlayers[2].history).toEqual(['lost']);
    result.updatedPlayers.forEach((p) => {
      expect(p.currentAction).toBeNull();
    });
  });

  it('applies a mid-round batch without trying to close the round', () => {
    // "matheus e joão correram" enquanto a mão ainda rola: não é o fim da rodada, e não
    // pode virar um erro. Aplica as ações e para por aí.
    const result = applyVoiceBatch(
      table(),
      10,
      [
        { playerId: '1', action: 'fold' },
        { playerId: '2', action: 'fold' },
      ],
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(false);
    expect(result.updatedPlayers[0].currentAction).toBe('fold');
    expect(result.updatedPlayers[1].currentAction).toBe('fold');
    // Nada foi para o histórico: a rodada continua aberta.
    expect(result.updatedPlayers[0].history).toEqual([]);
  });

  it('closes the round as soon as a winner is in the batch', () => {
    const result = applyVoiceBatch(
      table(),
      10,
      [
        { playerId: '1', action: 'fold' },
        { playerId: '2', action: 'won' },
      ],
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(true);
    expect(result.updatedPlayers[1].history).toEqual(['won']);
  });

  it('closes the round when a winner was already marked by tapping', () => {
    // A voz completa um lote parcial: o ganhador veio do dedo, os "correu" da fala.
    const players = table().map((p) =>
      p.id === '3' ? { ...p, currentAction: 'won' as const } : p,
    );

    const result = applyVoiceBatch(players, 10, [{ playerId: '1', action: 'fold' }], {
      advance: true,
    });

    expect(result.advanced).toBe(true);
    expect(result.updatedPlayers[2].history).toEqual(['won']);
  });

  it('collapses two spoken winners into one instead of erroring', () => {
    // A regra de ganhador único é aplicada durante o lote, então o segundo vence.
    const result = applyVoiceBatch(
      table(),
      10,
      [
        { playerId: '1', action: 'won' },
        { playerId: '2', action: 'won' },
      ],
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    expect(result.updatedPlayers[0].history).toEqual(['lost']);
    expect(result.updatedPlayers[1].history).toEqual(['won']);
  });

  it('is a no-op for an empty batch without advance', () => {
    const players = table();
    const result = applyVoiceBatch(players, 10, [], { advance: false });

    expect(result.hasError).toBe(false);
    expect(result.updatedPlayers).toEqual(players);
  });

  it('ignores eliminated players when deciding the round is valid', () => {
    const players = [
      makePlayer({ id: '1', history: ['lost', 'lost', 'lost', 'lost', 'lost'] }),
      makePlayer({ id: '2' }),
      makePlayer({ id: '3' }),
    ];

    const result = applyVoiceBatch(players, 10, [{ playerId: '2', action: 'won' }], {
      advance: true,
    });

    expect(result.hasError).toBe(false);
    // Jogador 1 já estourou (0 pontos) e não é forçado a "lost".
    expect(result.updatedPlayers[0].currentAction).toBeNull();
  });
});
