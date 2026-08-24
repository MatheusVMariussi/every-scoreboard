import {
  ACCEPT_SCORE,
  buildRoster,
  jaroWinkler,
  matchByPosition,
  matchPlayer,
} from '../matchPlayer';
import { normalizeToken } from '../normalize';
import type { RosterPlayer } from '../types';

const PLAYERS: RosterPlayer[] = [
  { id: '1', name: 'Léo' },
  { id: '2', name: 'Ana' },
  { id: '3', name: 'Tião' },
  { id: '4', name: 'Zé' },
];

const roster = buildRoster(PLAYERS, 'pt-BR');

/** Atalho: fala uma palavra crua e devolve o resultado do casamento. */
const say = (spoken: string, aliases: Record<string, string> = {}) =>
  matchPlayer(normalizeToken(spoken, 'pt-BR'), roster, aliases);

describe('jaroWinkler', () => {
  it('returns 1 for identical strings', () => {
    expect(jaroWinkler('leo', 'leo')).toBe(1);
  });

  it('returns 0 when nothing matches', () => {
    expect(jaroWinkler('leo', '')).toBe(0);
  });

  it('rewards a shared prefix, which is how short first names fail', () => {
    // Mesma distância de edição, mas o prefixo comum deve valer mais.
    expect(jaroWinkler('tiago', 'tiao')).toBeGreaterThan(jaroWinkler('tiago', 'otia'));
  });
});

describe('buildRoster', () => {
  it('precomputes normalized forms and 1-based positions', () => {
    expect(roster[0]).toMatchObject({ id: '1', normalized: 'leo', position: 1 });
    expect(roster[2]).toMatchObject({ id: '3', normalized: 'tiao', position: 3 });
  });

  it('collapses whitespace in multi-word names', () => {
    expect(buildRoster([{ id: '9', name: 'Ana Paula' }], 'pt-BR')[0].normalized).toBe('anapaula');
  });
});

describe('matchPlayer', () => {
  it('resolves exact names', () => {
    expect(say('Léo')).toMatchObject({ status: 'resolved', playerId: '1' });
    expect(say('Ana')).toMatchObject({ status: 'resolved', playerId: '2' });
  });

  it('resolves names the recognizer stripped of accents', () => {
    expect(say('tiao')).toMatchObject({ status: 'resolved', playerId: '3' });
    expect(say('ze')).toMatchObject({ status: 'resolved', playerId: '4' });
  });

  it('resolves plausible mis-transcriptions', () => {
    expect(say('thiago')).toMatchObject({ status: 'resolved', playerId: '3' });
    expect(say('zeh')).toMatchObject({ status: 'resolved', playerId: '4' });
  });

  it('refuses rather than guessing when nothing is close', () => {
    expect(say('cachorro').status).toBe('none');
    expect(say('mesa').status).toBe('none');
  });

  it('returns none for empty input or an empty roster', () => {
    expect(matchPlayer('', roster).status).toBe('none');
    expect(matchPlayer('leo', []).status).toBe('none');
  });

  it('never picks a side when two players are equally plausible', () => {
    const twins = buildRoster(
      [
        { id: 'a', name: 'Marcos' },
        { id: 'b', name: 'Marco' },
      ],
      'pt-BR',
    );
    const result = matchPlayer('marcus', twins);

    expect(result.status).not.toBe('resolved');
    if (result.status === 'ambiguous') {
      expect(result.candidates).toHaveLength(2);
    }
  });

  it('flags a weak-but-plausible match instead of silently trusting it', () => {
    const solo = buildRoster([{ id: 'j', name: 'João' }], 'pt-BR');
    const result = matchPlayer(normalizeToken('jao', 'pt-BR'), solo);

    expect(result).toMatchObject({ status: 'resolved', playerId: 'j' });
    if (result.status === 'resolved') {
      expect(result.score).toBeLessThan(ACCEPT_SCORE);
      expect(result.lowConfidence).toBe(true);
    }
  });

  it('trusts a learned session alias completely', () => {
    // A chave do apelido é o token já normalizado ("zezinho" -> "zezino").
    const result = say('zezinho', { [normalizeToken('zezinho', 'pt-BR')]: '4' });
    expect(result).toMatchObject({ status: 'resolved', playerId: '4', lowConfidence: false });
  });

  it('ignores an alias pointing at a player who left the table', () => {
    expect(say('fulano', { fulano: '99' }).status).toBe('none');
  });
});

describe('matchByPosition', () => {
  it('resolves 1-based table positions', () => {
    expect(matchByPosition(1, roster)).toMatchObject({ status: 'resolved', playerId: '1' });
    expect(matchByPosition(3, roster)).toMatchObject({ status: 'resolved', playerId: '3' });
  });

  it('returns none for a seat nobody occupies', () => {
    expect(matchByPosition(9, roster).status).toBe('none');
  });
});
