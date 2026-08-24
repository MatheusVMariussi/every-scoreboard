import { applyVoiceBatch, logicSetValue, type FodinhaPlayer } from '../useFodinhaGame';

const makePlayer = (overrides: Partial<FodinhaPlayer> = {}): FodinhaPlayer => ({
  id: '1',
  name: 'Player 1',
  lives: 10,
  history: [],
  currentBid: 0,
  currentWon: 0,
  ...overrides,
});

const table = (): FodinhaPlayer[] => [
  makePlayer({ id: '1', name: 'Léo' }),
  makePlayer({ id: '2', name: 'Ana' }),
  makePlayer({ id: '3', name: 'Tião' }),
];

const betting = (cardsInRound = 3) =>
  ({ phase: 'betting', cardsInRound, penaltyMode: 'fixed' }) as const;

const results = (cardsInRound = 3) =>
  ({ phase: 'results', cardsInRound, penaltyMode: 'fixed' }) as const;

// --- logicSetValue ---

describe('logicSetValue', () => {
  it('sets the bid during the betting phase', () => {
    const result = logicSetValue(table(), '1', 2, 'betting', 3);
    expect(result[0].currentBid).toBe(2);
    expect(result[0].currentWon).toBe(0);
  });

  it('sets tricks won during the results phase', () => {
    const result = logicSetValue(table(), '1', 2, 'results', 3);
    expect(result[0].currentWon).toBe(2);
    expect(result[0].currentBid).toBe(0);
  });

  it('clamps to the round size', () => {
    expect(logicSetValue(table(), '1', 99, 'betting', 3)[0].currentBid).toBe(3);
    expect(logicSetValue(table(), '1', -5, 'betting', 3)[0].currentBid).toBe(0);
  });

  it('leaves other players untouched', () => {
    const result = logicSetValue(table(), '2', 3, 'betting', 3);
    expect(result[0].currentBid).toBe(0);
    expect(result[2].currentBid).toBe(0);
  });
});

// --- applyVoiceBatch: apostas ---

describe('applyVoiceBatch / betting phase', () => {
  it('stages bids without advancing', () => {
    const result = applyVoiceBatch(table(), [{ playerId: '1', value: 2 }], betting(), {
      advance: false,
    });

    expect(result.hasError).toBe(false);
    expect(result.nextPhase).toBe('betting');
    expect(result.updatedPlayers[0].currentBid).toBe(2);
  });

  it('advances to results when the bids do not add up to the card count', () => {
    const result = applyVoiceBatch(
      table(),
      [
        { playerId: '1', value: 2 },
        { playerId: '2', value: 2 },
        { playerId: '3', value: 0 },
      ],
      betting(3),
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(true);
    expect(result.nextPhase).toBe('results');
    expect(result.roundFinished).toBe(false);
  });

  it('blocks the advance when the bids total exactly the card count, keeping the bids', () => {
    const result = applyVoiceBatch(
      table(),
      [
        { playerId: '1', value: 2 },
        { playerId: '2', value: 1 },
        { playerId: '3', value: 0 },
      ],
      betting(3),
      { advance: true },
    );

    expect(result.hasError).toBe(true);
    expect(result.errorKey).toBe('invalid_bets');
    expect(result.errorParams).toEqual({ total: 3, cards: 3 });
    expect(result.nextPhase).toBe('betting');
    // Os valores falados continuam lá para o usuário só ajustar um.
    expect(result.updatedPlayers[0].currentBid).toBe(2);
    expect(result.updatedPlayers[1].currentBid).toBe(1);
  });

  it('validates against the batched state, not the state before it', () => {
    // Antes do lote a soma é 0, que não bate com 3. Se a validação rodasse contra o
    // estado antigo, isto passaria por engano.
    const players = table();
    const result = applyVoiceBatch(
      players,
      [
        { playerId: '1', value: 3 },
        { playerId: '2', value: 0 },
        { playerId: '3', value: 0 },
      ],
      betting(3),
      { advance: true },
    );

    expect(result.hasError).toBe(true);
  });
});

// --- applyVoiceBatch: resultados ---

describe('applyVoiceBatch / results phase', () => {
  it('finishes the round when tricks won match the card count', () => {
    const players = [
      makePlayer({ id: '1', currentBid: 2 }),
      makePlayer({ id: '2', currentBid: 0 }),
      makePlayer({ id: '3', currentBid: 0 }),
    ];

    const result = applyVoiceBatch(
      players,
      [
        { playerId: '1', value: 2 },
        { playerId: '2', value: 1 },
        { playerId: '3', value: 0 },
      ],
      results(3),
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    expect(result.roundFinished).toBe(true);
    expect(result.nextPhase).toBe('betting');
    // Léo acertou a aposta e não perde vida; Ana pediu 0 e fez 1, perde 1.
    expect(result.updatedPlayers[0].lives).toBe(10);
    expect(result.updatedPlayers[1].lives).toBe(9);
    expect(result.updatedPlayers[0].history).toEqual([0]);
    expect(result.updatedPlayers[1].history).toEqual([1]);
  });

  it('banks the tricks and waits, with no alert, while the count is short', () => {
    const result = applyVoiceBatch(
      table(),
      [
        { playerId: '1', value: 1 },
        { playerId: '2', value: 0 },
        { playerId: '3', value: 0 },
      ],
      results(3),
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(false);
    expect(result.roundFinished).toBe(false);
    expect(result.nextPhase).toBe('results');
    // O valor fica no placar; a fila limpa e a rodada segue aberta.
    expect(result.updatedPlayers[0].currentWon).toBe(1);
  });

  it('alerts only when the tricks exceed the cards in the round', () => {
    const result = applyVoiceBatch(
      table(),
      [
        { playerId: '1', value: 2 },
        { playerId: '2', value: 2 },
      ],
      results(3),
      { advance: true },
    );

    expect(result.hasError).toBe(true);
    expect(result.errorKey).toBe('wrong_count');
    expect(result.errorParams).toEqual({ total: 4, cards: 3 });
    expect(result.roundFinished).toBe(false);
  });

  it('applies the difference penalty mode when configured', () => {
    const players = [makePlayer({ id: '1', currentBid: 3 }), makePlayer({ id: '2' })];

    const result = applyVoiceBatch(
      players,
      [
        { playerId: '1', value: 1 },
        { playerId: '2', value: 0 },
      ],
      { phase: 'results', cardsInRound: 1, penaltyMode: 'difference' },
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    // Apostou 3, fez 1 -> diferença de 2 vidas.
    expect(result.updatedPlayers[0].lives).toBe(8);
  });

  it('leaves eliminated players alone when finishing the round', () => {
    const players = [makePlayer({ id: '1', lives: 0, currentBid: 2 }), makePlayer({ id: '2' })];

    const result = applyVoiceBatch(players, [{ playerId: '2', value: 1 }], results(1), {
      advance: true,
    });

    expect(result.hasError).toBe(false);
    expect(result.updatedPlayers[0].lives).toBe(0);
    expect(result.updatedPlayers[0].history).toEqual([]);
  });

  it('is a no-op for an empty batch without advance', () => {
    const players = table();
    const result = applyVoiceBatch(players, [], results(), { advance: false });

    expect(result.hasError).toBe(false);
    expect(result.updatedPlayers).toEqual(players);
  });
});

// --- Cobertura do lote antes de fechar a fase ---

describe('applyVoiceBatch / partial batches never advance the phase', () => {
  it('applies a partial set of bids without moving to results', () => {
    const result = applyVoiceBatch(table(), [{ playerId: '1', value: 2 }], betting(3), {
      advance: true,
    });

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(false);
    expect(result.nextPhase).toBe('betting');
    expect(result.updatedPlayers[0].currentBid).toBe(2);
  });

  it('counts an explicit zero as a bid for coverage', () => {
    // "não vai fazer nada" cobre o jogador tanto quanto qualquer outro valor.
    const result = applyVoiceBatch(
      table(),
      [
        { playerId: '1', value: 2 },
        { playerId: '2', value: 0 },
        { playerId: '3', value: 0 },
      ],
      betting(3),
      { advance: true },
    );

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(true);
    expect(result.nextPhase).toBe('results');
  });

  it('does not require coverage in the results phase — the sum is the proof', () => {
    // Com 1 carta, uma única vaza fecha a rodada. Exigir que o lote falasse de todos
    // travaria o caminho normal: só um jogador faz a vaza.
    const result = applyVoiceBatch(table(), [{ playerId: '1', value: 1 }], results(1), {
      advance: true,
    });

    expect(result.hasError).toBe(false);
    expect(result.advanced).toBe(true);
    expect(result.roundFinished).toBe(true);
  });

  it('advances once the batch finally covers everyone', () => {
    const result = applyVoiceBatch(
      table(),
      [
        { playerId: '1', value: 2 },
        { playerId: '2', value: 2 },
        { playerId: '3', value: 2 },
      ],
      betting(3),
      { advance: true },
    );

    expect(result.advanced).toBe(true);
    expect(result.nextPhase).toBe('results');
  });

  it('ignores eliminated players when checking coverage', () => {
    const players = [
      makePlayer({ id: '1', lives: 0 }),
      makePlayer({ id: '2' }),
      makePlayer({ id: '3' }),
    ];

    const result = applyVoiceBatch(
      players,
      [
        { playerId: '2', value: 2 },
        { playerId: '3', value: 2 },
      ],
      betting(3),
      { advance: true },
    );

    expect(result.advanced).toBe(true);
  });

  it('never advances on an empty batch', () => {
    const result = applyVoiceBatch(table(), [], betting(3), { advance: true });

    expect(result.advanced).toBe(false);
    expect(result.nextPhase).toBe('betting');
  });
});

// --- Vazas somando até fechar a rodada ---

describe('applyVoiceBatch / tricks accumulate until the card count is reached', () => {
  it('stays open across several approvals, then closes on the exact count', () => {
    const first = applyVoiceBatch(table(), [{ playerId: '1', value: 1 }], results(3), {
      advance: true,
    });

    expect(first.hasError).toBe(false);
    expect(first.roundFinished).toBe(false);

    const second = applyVoiceBatch(
      first.updatedPlayers,
      [{ playerId: '2', value: 2 }],
      results(3),
      { advance: true },
    );

    expect(second.hasError).toBe(false);
    expect(second.roundFinished).toBe(true);
    // Léo pediu 0 e fez 1; Ana pediu 0 e fez 2. Ambos erram, ambos perdem 1 vida.
    expect(second.updatedPlayers[0].lives).toBe(9);
    expect(second.updatedPlayers[1].lives).toBe(9);
  });

  it('closes immediately when a single trick fills a one-card round', () => {
    const result = applyVoiceBatch(table(), [{ playerId: '1', value: 1 }], results(1), {
      advance: true,
    });

    expect(result.roundFinished).toBe(true);
  });
});
