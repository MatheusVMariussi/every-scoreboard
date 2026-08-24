import {
  emptyPending,
  ingest,
  pruneExpired,
  UNRESOLVED_TTL_MS,
  isPendingEmpty,
  pendingCount,
  removeEntry,
  removeUnresolved,
  resolveUnresolved,
  toCachetaBatch,
  toFodinhaBatch,
} from '../pendingQueue';
import type { VoiceCommand } from '../types';

/** Gerador de id determinístico — `Date.now()` colidiria dentro de um mesmo lote. */
const makeIds = () => {
  let n = 0;
  return () => {
    n += 1;
    return `u${String(n)}`;
  };
};

const add = (commands: VoiceCommand[], state = emptyPending()) =>
  ingest(state, commands, { nextId: makeIds() });

const won = (playerId: string, confidence = 1): VoiceCommand => ({
  kind: 'cacheta.action',
  playerId,
  action: 'won',
  confidence,
});

const fold = (playerId: string, confidence = 1): VoiceCommand => ({
  kind: 'cacheta.action',
  playerId,
  action: 'fold',
  confidence,
});

describe('pendingQueue / replace-per-player', () => {
  it('keeps one row per player, not one per utterance', () => {
    const first = add([fold('1'), fold('2')]);
    const second = ingest(first.state, [won('1')], { nextId: makeIds() });

    expect(Object.keys(second.state.entries)).toHaveLength(2);
    expect(second.state.entries['1'].value).toEqual({ game: 'cacheta', action: 'won' });
  });

  it('flags the replacement so the correction is visible', () => {
    const first = add([fold('1')]);
    expect(first.state.entries['1'].wasCorrected).toBe(false);

    const second = ingest(first.state, [won('1')], { nextId: makeIds() });
    expect(second.state.entries['1'].wasCorrected).toBe(true);
  });

  it('collapses repeats inside a single utterance too', () => {
    const result = add([fold('1'), won('1')]);

    expect(Object.keys(result.state.entries)).toHaveLength(1);
    expect(result.state.entries['1'].value).toEqual({ game: 'cacheta', action: 'won' });
  });

  it('carries confidence through so the UI can flag weak matches', () => {
    const result = add([fold('1', 0.74)]);
    expect(result.state.entries['1'].confidence).toBeCloseTo(0.74);
  });
});

describe('pendingQueue / control signals', () => {
  it('reports advance without putting it in the queue', () => {
    const result = add([{ kind: 'advance' }]);

    expect(result.advance).toBe(true);
    expect(isPendingEmpty(result.state)).toBe(true);
  });

  it('reports undo without putting it in the queue', () => {
    const result = add([{ kind: 'undo' }]);

    expect(result.undo).toBe(true);
    expect(isPendingEmpty(result.state)).toBe(true);
  });
});

describe('pendingQueue / unresolved names', () => {
  const unresolved: VoiceCommand = {
    kind: 'unresolved',
    token: 'fulano',
    candidates: [],
    intent: { game: 'cacheta', action: 'fold' },
  };

  it('keeps the heard token and its intent', () => {
    const result = add([unresolved]);

    expect(result.state.unresolved).toHaveLength(1);
    expect(result.state.unresolved[0]).toMatchObject({
      token: 'fulano',
      value: { game: 'cacheta', action: 'fold' },
    });
  });

  it('gives every unresolved row a distinct id within one batch', () => {
    const result = add([unresolved, unresolved]);
    const [first, second] = result.state.unresolved;

    expect(first.id).not.toBe(second.id);
  });

  it('promotes an unresolved row to a real entry when the user taps a player', () => {
    const queued = add([unresolved]);
    const resolved = resolveUnresolved(queued.state, queued.state.unresolved[0].id, '3');

    expect(resolved.unresolved).toHaveLength(0);
    expect(resolved.entries['3']).toMatchObject({
      playerId: '3',
      value: { game: 'cacheta', action: 'fold' },
      confidence: 1,
    });
  });

  it('ignores a resolve for an id that is no longer queued', () => {
    const state = add([unresolved]).state;
    expect(resolveUnresolved(state, 'nope', '1')).toBe(state);
  });

  it('counts unresolved rows as needing attention', () => {
    const result = add([fold('1'), unresolved]);
    expect(pendingCount(result.state)).toBe(2);
  });
});

describe('pendingQueue / unparsed speech', () => {
  it('drops speech it could not parse instead of queueing it', () => {
    // A fila é só para o que dá para aprovar. Listar "não entendi" enchia o painel de
    // linhas que ninguém pode acionar.
    const result = add([{ kind: 'unparsed', raw: 'passa a cerveja' }]);

    expect(isPendingEmpty(result.state)).toBe(true);
    expect(pendingCount(result.state)).toBe(0);
  });

  it('keeps the understood commands from a mixed utterance', () => {
    const result = add([fold('1'), { kind: 'unparsed', raw: 'boa beleza então' }]);

    expect(pendingCount(result.state)).toBe(1);
    expect(result.state.entries['1'].value).toEqual({ game: 'cacheta', action: 'fold' });
  });
});

describe('pendingQueue / removal', () => {
  it('removes a single player row', () => {
    const state = add([fold('1'), fold('2')]).state;
    expect(Object.keys(removeEntry(state, '1').entries)).toEqual(['2']);
  });

  it('removes a single unresolved row', () => {
    const state = add([
      {
        kind: 'unresolved',
        token: 'x',
        candidates: [],
        intent: { game: 'cacheta', action: 'won' },
      },
    ]).state;

    expect(removeUnresolved(state, state.unresolved[0].id).unresolved).toHaveLength(0);
  });
});

describe('pendingQueue / batch conversion', () => {
  it('converts cacheta entries into an apply batch', () => {
    const state = add([won('1'), fold('2')]).state;
    const batch = toCachetaBatch(state);

    expect(batch).toHaveLength(2);
    expect(batch).toContainEqual({ playerId: '1', action: 'won' });
    expect(batch).toContainEqual({ playerId: '2', action: 'fold' });
  });

  it('converts fodinha entries into an apply batch', () => {
    const state = add([
      { kind: 'fodinha.value', playerId: '1', amount: 2, mode: 'set', confidence: 1 },
      { kind: 'fodinha.value', playerId: '2', amount: 0, mode: 'set', confidence: 1 },
    ]).state;

    expect(toFodinhaBatch(state)).toContainEqual({ playerId: '1', value: 2 });
    expect(toFodinhaBatch(state)).toContainEqual({ playerId: '2', value: 0 });
  });

  it('does not leak entries from the other game into a batch', () => {
    const state = add([
      won('1'),
      { kind: 'fodinha.value', playerId: '2', amount: 3, mode: 'set', confidence: 1 },
    ]).state;

    expect(toCachetaBatch(state)).toEqual([{ playerId: '1', action: 'won' }]);
    expect(toFodinhaBatch(state)).toEqual([{ playerId: '2', value: 3 }]);
  });
});

// --- Prazo das perguntas de nome ---

describe('pendingQueue / unresolved rows expire', () => {
  const NOW = 1_000_000;

  const question: VoiceCommand = {
    kind: 'unresolved',
    token: 'analise',
    candidates: [],
    intent: { game: 'cacheta', action: 'fold' },
  };

  const queued = () => ingest(emptyPending(), [question], { nextId: makeIds(), now: NOW }).state;

  it('stamps an expiry when the question is queued', () => {
    expect(queued().unresolved[0].expiresAt).toBe(NOW + UNRESOLVED_TTL_MS);
  });

  it('keeps the question while it is still fresh', () => {
    const state = queued();
    expect(pruneExpired(state, NOW + UNRESOLVED_TTL_MS - 1).unresolved).toHaveLength(1);
  });

  it('drops the question once the deadline passes', () => {
    const state = queued();
    expect(pruneExpired(state, NOW + UNRESOLVED_TTL_MS + 1).unresolved).toHaveLength(0);
  });

  it('returns the same object when nothing expired, to avoid a pointless render', () => {
    const state = queued();
    expect(pruneExpired(state, NOW)).toBe(state);
  });

  it('never expires a resolved entry — only the questions have a deadline', () => {
    const state = ingest(queued(), [fold('1')], { nextId: makeIds(), now: NOW }).state;
    const swept = pruneExpired(state, NOW + UNRESOLVED_TTL_MS + 1);

    expect(swept.unresolved).toHaveLength(0);
    expect(Object.keys(swept.entries)).toEqual(['1']);
  });

  it('keeps a question that was answered before the deadline', () => {
    const state = queued();
    const answered = resolveUnresolved(state, state.unresolved[0].id, '2');
    const swept = pruneExpired(answered, NOW + UNRESOLVED_TTL_MS + 1);

    // Virou entrada de jogador: o prazo não a alcança mais.
    expect(swept.entries['2']).toBeDefined();
  });
});

// --- Vazas cantadas uma a uma ---

describe('pendingQueue / fodinha increments', () => {
  const fez = (playerId: string): VoiceCommand => ({
    kind: 'fodinha.value',
    playerId,
    amount: 1,
    mode: 'add',
    confidence: 1,
  });

  const opts = (over: Record<string, unknown> = {}) => ({ nextId: makeIds(), ...over });

  it('starts from the board value when nothing is pending yet', () => {
    const result = ingest(emptyPending(), [fez('1')], opts({ baseline: { '1': 2 } }));
    expect(result.state.entries['1'].value).toEqual({ game: 'fodinha', value: 3 });
  });

  it('starts from zero when the player has nothing on the board', () => {
    const result = ingest(emptyPending(), [fez('1')], opts());
    expect(result.state.entries['1'].value).toEqual({ game: 'fodinha', value: 1 });
  });

  it('accumulates across separate utterances instead of repeating itself', () => {
    // Este é o ponto: "matheus fez" duas vezes tem de virar 2, não 1 duas vezes.
    const first = ingest(emptyPending(), [fez('1')], opts());
    const second = ingest(first.state, [fez('1')], opts());

    expect(second.state.entries['1'].value).toEqual({ game: 'fodinha', value: 2 });
  });

  it('accumulates within a single utterance too', () => {
    const result = ingest(emptyPending(), [fez('1'), fez('1')], opts());
    expect(result.state.entries['1'].value).toEqual({ game: 'fodinha', value: 2 });
  });

  it('never climbs past the cards in the round', () => {
    const result = ingest(emptyPending(), [fez('1')], opts({ baseline: { '1': 3 }, maxValue: 3 }));
    expect(result.state.entries['1'].value).toEqual({ game: 'fodinha', value: 3 });
  });

  it('lets an explicit value overwrite an accumulated one', () => {
    const first = ingest(emptyPending(), [fez('1')], opts());
    const second = ingest(
      first.state,
      [{ kind: 'fodinha.value', playerId: '1', amount: 0, mode: 'set', confidence: 1 }],
      opts(),
    );

    expect(second.state.entries['1'].value).toEqual({ game: 'fodinha', value: 0 });
  });
});
