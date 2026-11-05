import {
  computeLives,
  getGameOutcome,
  getMaxCards,
  getNextRoundCards,
  getPreviousRoundCards,
  getRoundDeletion,
  getRoundCount,
  getRoundTransition,
  logicAddPlayer,
  logicClampValues,
  logicFinishRound,
  logicUpdateValue,
  orderForTable,
  logicUpdateHistoryDamage,
  logicRemoveRound,
  logicRemovePlayer,
  logicResetPlayers,
  logicSetLives,
  MAX_LIVES,
  parseFodinhaSave,
  sumLiving,
  type CardsDirection,
  type FodinhaPlayer,
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

    it('records a skipped round for eliminated players, keeping the columns aligned', () => {
      const players = [makePlayer({ lives: 0, history: [3], currentBid: 1, currentWon: 3 })];
      const result = logicFinishRound(players, 'fixed');
      expect(result[0].lives).toBe(0);
      expect(result[0].history).toEqual([3, null]);
      // Valores velhos de um eliminado não podem vazar para os totais da próxima rodada.
      expect(result[0].currentBid).toBe(0);
      expect(result[0].currentWon).toBe(0);
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
    expect(result[1].lives).toBe(9); // 1 damage
    expect(result[2].lives).toBe(0); // untouched
    expect(result.map((p) => p.history.length)).toEqual([1, 1, 1]);
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

  it('ignores eliminated players', () => {
    const players = [makePlayer({ id: '1', lives: 0 })];
    const result = logicUpdateValue(players, '1', 1, 'betting', 5);
    expect(result[0].currentBid).toBe(0);
  });
});

// --- logicClampValues ---

describe('logicClampValues', () => {
  it('pulls bids and tricks down to the new card count', () => {
    const players = [makePlayer({ id: '1', currentBid: 3, currentWon: 2 })];
    const result = logicClampValues(players, 2);
    expect(result[0].currentBid).toBe(2);
    expect(result[0].currentWon).toBe(2);
  });

  it('keeps the same object when nothing changes', () => {
    const player = makePlayer({ id: '1', currentBid: 1 });
    expect(logicClampValues([player], 3)[0]).toBe(player);
  });
});

// --- computeLives / logicUpdateHistoryDamage ---

describe('computeLives', () => {
  it('ignores rounds the player did not play', () => {
    expect(computeLives(10, [2, null, 1])).toBe(7);
  });

  it('never goes below zero', () => {
    expect(computeLives(3, [2, 2])).toBe(0);
  });
});

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

  it('leaves a round the player did not play untouched', () => {
    const player = makePlayer({ id: '1', lives: 0, history: [10, null] });
    const result = logicUpdateHistoryDamage([player], '1', 1, 1, 10);
    expect(result[0]).toBe(player);
  });

  it('does not let lives go negative', () => {
    const players = [makePlayer({ id: '1', lives: 0, history: [10] })];
    const result = logicUpdateHistoryDamage(players, '1', 2, 0, 10);
    expect(result[0].lives).toBe(0);
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

  it('revives a player whose fatal round is removed', () => {
    const players = [makePlayer({ id: '1', lives: 0, history: [2, 1, null] })];
    const result = logicRemoveRound(players, 1, 3);
    expect(result[0].history).toEqual([2, null]);
    expect(result[0].lives).toBe(1);
  });
});

// --- logicRemovePlayer / logicAddPlayer ---

describe('logicRemovePlayer', () => {
  it('removes the player with matching id', () => {
    const players = [makePlayer({ id: '1' }), makePlayer({ id: '2' })];
    const result = logicRemovePlayer(players, '1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

describe('logicAddPlayer', () => {
  it('marks the rounds already played as not played by the newcomer', () => {
    const players = [makePlayer({ id: '1', history: [0, 1] })];
    const result = logicAddPlayer(players, { id: '2', name: 'Ana' }, 7);
    expect(result[1]).toEqual({
      id: '2',
      name: 'Ana',
      lives: 7,
      history: [null, null],
      currentBid: 0,
      currentWon: 0,
    });
  });
});

// --- getRoundCount / sumLiving ---

describe('getRoundCount', () => {
  it('keeps counting rounds after the first player is eliminated', () => {
    // Save antigo: o eliminado tinha histórico mais curto.
    const players = [
      makePlayer({ id: '1', lives: 0, history: [5] }),
      makePlayer({ id: '2', history: [0, 0, 1] }),
    ];
    expect(getRoundCount(players)).toBe(3);
  });

  it('is zero without players', () => {
    expect(getRoundCount([])).toBe(0);
  });
});

describe('sumLiving', () => {
  it('only counts players still in the game', () => {
    const players = [
      makePlayer({ id: '1', currentBid: 2 }),
      makePlayer({ id: '2', lives: 0, currentBid: 5 }),
    ];
    expect(sumLiving(players, 'currentBid')).toBe(2);
  });
});

// --- getMaxCards ---

describe('getMaxCards', () => {
  it('splits a 40-card deck, minus the vira, among the living players', () => {
    expect(getMaxCards(1, 3)).toBe(13);
    expect(getMaxCards(1, 4)).toBe(9);
    expect(getMaxCards(1, 5)).toBe(7);
  });

  it('grows with more decks', () => {
    expect(getMaxCards(2, 4)).toBe(19); // (80 - 1) / 4
  });

  it('never drops below one card', () => {
    expect(getMaxCards(1, 50)).toBe(1);
  });

  it('does not divide by zero when nobody is alive', () => {
    expect(getMaxCards(1, 0)).toBe(39);
  });
});

// --- getNextRoundCards ---

const playSequence = (start: number, direction: CardsDirection, max: number, rounds: number) => {
  const sequence: number[] = [];
  let state = { cards: start, direction };
  for (let i = 0; i < rounds; i += 1) {
    state = getNextRoundCards(state.cards, state.direction, max);
    sequence.push(state.cards);
  }
  return sequence;
};

describe('getNextRoundCards', () => {
  it('climbs to the limit, comes back to 1 and climbs again without repeating the ends', () => {
    expect(playSequence(1, 'up', 9, 18)).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3,
    ]);
  });

  it('alternates between 1 and 2 when the limit is 2', () => {
    expect(playSequence(1, 'up', 2, 4)).toEqual([2, 1, 2, 1]);
  });

  it('stays at 1 when the limit is 1', () => {
    expect(getNextRoundCards(1, 'up', 1)).toEqual({ cards: 1, direction: 'up' });
    expect(getNextRoundCards(1, 'down', 1)).toEqual({ cards: 1, direction: 'up' });
  });

  it('turns down once the limit is reached', () => {
    expect(getNextRoundCards(9, 'up', 9)).toEqual({ cards: 8, direction: 'down' });
  });

  it('turns up once it reaches 1', () => {
    expect(getNextRoundCards(1, 'down', 9)).toEqual({ cards: 2, direction: 'up' });
  });

  it('pulls a card count above the limit back inside it, in either direction', () => {
    // Save antigo do tempo em que as cartas cresciam sem limite.
    expect(getNextRoundCards(15, 'up', 9)).toEqual({ cards: 8, direction: 'down' });
    expect(getNextRoundCards(15, 'down', 9)).toEqual({ cards: 8, direction: 'down' });
  });

  it('keeps climbing when an elimination raises the limit', () => {
    expect(getNextRoundCards(9, 'up', 13)).toEqual({ cards: 10, direction: 'up' });
  });
});

// --- getGameOutcome ---

describe('getGameOutcome', () => {
  it('keeps playing while two or more players are alive', () => {
    const players = [
      makePlayer({ id: '1', history: [0] }),
      makePlayer({ id: '2', history: [1], lives: 9 }),
    ];
    expect(getGameOutcome(players)).toEqual({ status: 'playing' });
  });

  it('declares the last survivor the winner', () => {
    const players = [
      makePlayer({ id: '1', lives: 1, history: [0] }),
      makePlayer({ id: '2', lives: 0, history: [1] }),
      makePlayer({ id: '3', lives: 0, history: [null] }),
    ];
    const outcome = getGameOutcome(players);
    expect(outcome.status).toBe('won');
    expect(outcome.status === 'won' && outcome.winner.id).toBe('1');
  });

  it('ties the players who fell together in the last round', () => {
    const players = [
      makePlayer({ id: '1', lives: 0, history: [0, 1] }),
      makePlayer({ id: '2', lives: 0, history: [0, 2] }),
      makePlayer({ id: '3', lives: 0, history: [1, null] }), // já estava fora
    ];
    const outcome = getGameOutcome(players);
    expect(outcome.status).toBe('tie');
    expect(outcome.status === 'tie' && outcome.players.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('ties at the latest round anyone left at the table played', () => {
    // O vencedor foi removido da mesa: quem sobrou caiu junto na rodada 2, não na 3.
    const players = [
      makePlayer({ id: '1', lives: 0, history: [0, 2, null] }),
      makePlayer({ id: '2', lives: 0, history: [1, 1, null] }),
      makePlayer({ id: '3', lives: 0, history: [2, null, null] }),
    ];
    const outcome = getGameOutcome(players);
    expect(outcome.status === 'tie' && outcome.players.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('is not over before the first round', () => {
    const players = [makePlayer({ id: '1' }), makePlayer({ id: '2', lives: 0 })];
    expect(getGameOutcome(players)).toEqual({ status: 'playing' });
  });

  it('is not over with a single player at the table', () => {
    expect(getGameOutcome([makePlayer({ history: [0] })])).toEqual({ status: 'playing' });
  });
});

// --- getRoundTransition ---

describe('getRoundTransition', () => {
  it('uses the players left alive after the round to size the next one', () => {
    // 4 na mesa davam 9 cartas; com um eliminado agora, o limite é 13.
    const finished = [
      makePlayer({ id: '1', history: [0] }),
      makePlayer({ id: '2', history: [0] }),
      makePlayer({ id: '3', history: [0] }),
      makePlayer({ id: '4', lives: 0, history: [1] }),
    ];
    const transition = getRoundTransition(finished, {
      cardsInRound: 9,
      cardsDirection: 'up',
      deckCount: 1,
    });
    expect(transition.cardsInRound).toBe(10);
    expect(transition.cardsDirection).toBe('up');
    expect(transition.outcome).toEqual({ status: 'playing' });
  });

  it('reports the end of the game', () => {
    const finished = [
      makePlayer({ id: '1', history: [0] }),
      makePlayer({ id: '2', lives: 0, history: [1] }),
    ];
    const transition = getRoundTransition(finished, {
      cardsInRound: 1,
      cardsDirection: 'up',
      deckCount: 1,
    });
    expect(transition.outcome.status).toBe('won');
  });
});

// --- parseFodinhaSave ---

describe('parseFodinhaSave', () => {
  const legacySave = {
    players: [
      { id: '1', name: 'Matheus', lives: 3, history: [0, 1, 0], currentBid: 1, currentWon: 0 },
      { id: '2', name: 'Leo', lives: 0, history: [1], currentBid: 0, currentWon: 0 },
    ],
    initialLives: 4,
    penaltyMode: 'difference',
    cardsInRound: 15,
    roundPhase: 'results',
  };

  it('reads a save from before decks existed, with the new fields at their defaults', () => {
    const save = parseFodinhaSave(legacySave);
    expect(save).not.toBeNull();
    expect(save?.deckCount).toBe(1);
    expect(save?.cardsDirection).toBe('up');
    // A rodada em andamento não é mexida, mesmo acima do limite.
    expect(save?.cardsInRound).toBe(15);
    expect(save?.roundPhase).toBe('results');
    expect(save?.penaltyMode).toBe('difference');
    expect(save?.initialLives).toBe(4);
  });

  it('falls back to 7 initial lives when the save has none or an invalid value', () => {
    expect(parseFodinhaSave({ ...legacySave, initialLives: undefined })?.initialLives).toBe(7);
    expect(parseFodinhaSave({ ...legacySave, initialLives: 0 })?.initialLives).toBe(7);
  });

  it('pads the shorter histories of eliminated players', () => {
    const save = parseFodinhaSave(legacySave);
    expect(save?.players[1].history).toEqual([1, null, null]);
  });

  it('aligns a late joiner of an old save with the latest rounds', () => {
    // No app antigo quem entrava depois herdava o tamanho do histórico do jogador 1, que
    // parava quando ele caía: o histórico vivo e curto termina nas rodadas mais recentes.
    const save = parseFodinhaSave({
      ...legacySave,
      players: [
        ...legacySave.players,
        { id: '3', name: 'Ana', lives: 4, history: [0, 1], currentBid: 0, currentWon: 0 },
      ],
    });
    expect(save?.players[2].history).toEqual([null, 0, 1]);
  });

  it('keeps the new fields when present', () => {
    const save = parseFodinhaSave({ ...legacySave, deckCount: 2, cardsDirection: 'down' });
    expect(save?.deckCount).toBe(2);
    expect(save?.cardsDirection).toBe('down');
  });

  it('falls back to defaults for out-of-range values', () => {
    const save = parseFodinhaSave({
      ...legacySave,
      deckCount: 99,
      cardsDirection: 'sideways',
      roundPhase: 'lunch',
      penaltyMode: 42,
    });
    expect(save?.deckCount).toBe(1);
    expect(save?.cardsDirection).toBe('up');
    expect(save?.roundPhase).toBe('betting');
    expect(save?.penaltyMode).toBe('fixed');
  });

  it('rejects data that is not a save', () => {
    expect(parseFodinhaSave(null)).toBeNull();
    expect(parseFodinhaSave('oops')).toBeNull();
    expect(parseFodinhaSave({ players: 'nope' })).toBeNull();
    expect(parseFodinhaSave({ players: [{ name: 'sem id' }] })).toBeNull();
  });
});

// --- orderForTable ---

describe('orderForTable', () => {
  const seat = (id: string, lives: number) => makePlayer({ id, name: `P${id}`, lives });
  const ids = (players: readonly FodinhaPlayer[]) => players.map((p) => p.id);

  it('moves eliminated players below the living, keeping the seat order within each group', () => {
    const players = [seat('1', 3), seat('2', 0), seat('3', 2), seat('4', 0), seat('5', 1)];
    expect(ids(orderForTable(players))).toEqual(['1', '3', '5', '2', '4']);
  });

  it('keeps the seat order when nobody is out', () => {
    const players = [seat('1', 3), seat('2', 1), seat('3', 2)];
    expect(ids(orderForTable(players))).toEqual(['1', '2', '3']);
  });

  it('keeps the seat order when everyone is out (a tie)', () => {
    const players = [seat('1', 0), seat('2', 0)];
    expect(ids(orderForTable(players))).toEqual(['1', '2']);
  });

  it('does not reorder the stored players, so a restart puts everyone back in their seat', () => {
    const players = [seat('1', 0), seat('2', 3)];
    orderForTable(players);
    expect(ids(players)).toEqual(['1', '2']);
    const restarted = players.map((p) => ({ ...p, lives: 7 }));
    expect(ids(orderForTable(restarted))).toEqual(['1', '2']);
  });
});

// --- deleting a round rewinds the card sequence ---

describe('getPreviousRoundCards', () => {
  it('undoes one step of the sequence, including at both turning points', () => {
    const max = 4;
    let state: { cards: number; direction: CardsDirection } = { cards: 1, direction: 'up' };
    // 1, 2, 3, 4, 3, 2, 1, 2, 3 — passa pelo topo e pelo fundo.
    for (let i = 0; i < 8; i += 1) {
      const next = getNextRoundCards(state.cards, state.direction, max);
      const back = getPreviousRoundCards(next.cards, next.direction);
      expect(back.cards).toBe(state.cards);
      // Voltar e avançar de novo reproduz a mesma rodada.
      expect(getNextRoundCards(back.cards, back.direction, max)).toEqual(next);
      state = next;
    }
  });

  it('stays at 1 card going up when there is nothing before it', () => {
    expect(getPreviousRoundCards(1, 'up')).toEqual({ cards: 1, direction: 'up' });
  });
});

describe('getRoundDeletion', () => {
  const p = (id: string, history: (number | null)[]) =>
    makePlayer({ id, history, lives: computeLives(7, history) });

  it('puts the card count back when the last round is deleted', () => {
    // Rodadas com 1 e 2 cartas jogadas; a próxima seria de 3.
    const players = [p('1', [0, 1]), p('2', [1, 0]), p('3', [0, 1])];
    const result = getRoundDeletion(players, 1, {
      initialLives: 7,
      cardsInRound: 3,
      cardsDirection: 'up',
      deckCount: 1,
    });
    expect(getRoundCount(result.players)).toBe(1);
    expect(result.cardsInRound).toBe(2);
    expect(result.cardsDirection).toBe('up');
    expect(result.players.map((x) => x.lives)).toEqual([7, 6, 7]);
  });

  it('goes back to 1 card when the only round is deleted', () => {
    const players = [p('1', [1]), p('2', [0])];
    const result = getRoundDeletion(players, 0, {
      initialLives: 7,
      cardsInRound: 2,
      cardsDirection: 'up',
      deckCount: 1,
    });
    expect(getRoundCount(result.players)).toBe(0);
    expect(result.cardsInRound).toBe(1);
  });

  it('keeps the rewound count within the limit and clamps bets above it', () => {
    // 4 vivos com 1 baralho: limite de 9 cartas. A sequência voltaria para 10.
    const players = [{ ...p('1', [0]), currentBid: 10 }, p('2', [0]), p('3', [0]), p('4', [0])];
    const result = getRoundDeletion(players, 0, {
      initialLives: 7,
      cardsInRound: 9,
      cardsDirection: 'down',
      deckCount: 1,
    });
    expect(result.cardsInRound).toBe(9);
    expect(result.players[0].currentBid).toBe(9);
  });
});

describe('logicSetLives', () => {
  // Vidas iniciais 7, perdeu 1 e 2: a conta do histórico dá 4.
  const player = () => makePlayer({ id: '1', history: [1, 2], lives: 4 });

  it('sets the lives typed in the player modal', () => {
    const [result] = logicSetLives([player()], '1', 6, 7);
    expect(result.lives).toBe(6);
  });

  it('keeps the correction when a past round is edited later', () => {
    const corrected = logicSetLives([player()], '1', 6, 7);
    // A rodada 2 custou 1 a menos: as 6 corrigidas viram 7, não as 5 do histórico puro.
    const [result] = logicUpdateHistoryDamage(corrected, '1', -1, 1, 7);
    expect(result.lives).toBe(7);
  });

  it('keeps the correction when a round is deleted later', () => {
    const corrected = logicSetLives([player()], '1', 6, 7);
    const [result] = logicRemoveRound(corrected, 1, 7);
    expect(result.lives).toBe(8);
  });

  it('keeps counting damage after bringing an eliminated player back', () => {
    // Caiu com folga: 3 vidas e 5 de dano na última rodada.
    const fallen = makePlayer({ id: '1', history: [5], lives: 0 });
    const revived = logicSetLives([fallen], '1', 2, 3);
    expect(revived[0].lives).toBe(2);

    const [afterRound] = logicFinishRound(
      [{ ...revived[0], currentBid: 0, currentWon: 1 }],
      'fixed',
    );
    expect(afterRound.lives).toBe(1);
    // A conta do histórico chega ao mesmo número.
    const [recounted] = logicUpdateHistoryDamage([afterRound], '1', 0, 1, 3);
    expect(recounted.lives).toBe(1);
  });

  it('eliminates the player when set to zero', () => {
    const [result] = logicSetLives([player()], '1', 0, 7);
    expect(result.lives).toBe(0);
  });

  it('stays between zero and the lives limit', () => {
    expect(logicSetLives([player()], '1', -3, 7)[0].lives).toBe(0);
    expect(logicSetLives([player()], '1', MAX_LIVES + 10, 7)[0].lives).toBe(MAX_LIVES);
  });

  it('leaves the player untouched when the lives did not change', () => {
    const players = [player()];
    expect(logicSetLives(players, '1', 4, 7)[0]).toBe(players[0]);
  });

  it('only touches the chosen player', () => {
    const other = makePlayer({ id: '2', lives: 5 });
    const result = logicSetLives([player(), other], '1', 6, 7);
    expect(result[1]).toBe(other);
  });
});

describe('logicResetPlayers', () => {
  it('drops manual corrections when a new match starts', () => {
    const corrected = logicSetLives(
      [makePlayer({ id: '1', history: [1, 2], lives: 4 })],
      '1',
      6,
      7,
    );
    const [restarted] = logicResetPlayers(corrected, 7);
    expect(restarted.lives).toBe(7);
    expect(restarted.history).toEqual([]);

    // Sem ajuste sobrando: a primeira rodada da partida nova conta a partir de 7.
    const [afterEdit] = logicUpdateHistoryDamage(
      logicFinishRound([{ ...restarted, currentBid: 1, currentWon: 0 }], 'fixed'),
      '1',
      0,
      0,
      7,
    );
    expect(afterEdit.lives).toBe(6);
  });

  it('keeps names and seats', () => {
    const players = [makePlayer({ id: '1', name: 'Ana' }), makePlayer({ id: '2', name: 'Leo' })];
    expect(logicResetPlayers(players, 5).map((p) => [p.id, p.name, p.lives])).toEqual([
      ['1', 'Ana', 5],
      ['2', 'Leo', 5],
    ]);
  });
});

describe('parseFodinhaSave lives corrections', () => {
  const save = (player: Record<string, unknown>) => ({
    players: [player],
    initialLives: 7,
    penaltyMode: 'fixed',
    cardsInRound: 1,
    roundPhase: 'betting',
  });

  it('restores a manual correction', () => {
    const parsed = parseFodinhaSave(
      save({ id: '1', name: 'Ana', lives: 6, history: [1, 2], livesAdjustment: 2 }),
    );
    // Editar a rodada depois de reabrir o app continua respeitando a correção.
    const [edited] = logicUpdateHistoryDamage(parsed?.players ?? [], '1', -1, 1, 7);
    expect(edited.lives).toBe(7);
  });

  it('uses the correction when lives must be recomputed from the history', () => {
    const parsed = parseFodinhaSave(
      save({ id: '1', name: 'Ana', history: [1, 2], livesAdjustment: 2 }),
    );
    expect(parsed?.players[0].lives).toBe(6);
  });

  it('ignores an invalid correction', () => {
    const parsed = parseFodinhaSave(
      save({ id: '1', name: 'Ana', history: [1, 2], livesAdjustment: 'two' }),
    );
    expect(parsed?.players[0].lives).toBe(4);
  });
});
