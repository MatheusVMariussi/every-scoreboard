/**
 * Gramática en-US pelo parser.
 *
 * O arquivo irmão (`parseCommand.test.ts`) cobre a mecânica do parser em pt-BR — ordem
 * das orações, quantificadores, cortes de confiança. Aqui o alvo é outro: o que muda
 * quando o idioma muda. Verbos, números, controle, e os pares de nomes homófonos que a
 * normalização en-US existe para colapsar.
 */

import { normalizeToken } from '../normalize';
import { parseCommand } from '../parseCommand';
import type { ParseContext, RosterPlayer, VoiceCommand } from '../types';

const PLAYERS: RosterPlayer[] = [
  { id: '1', name: 'Chris' },
  { id: '2', name: 'Emma' },
  { id: '3', name: 'Jon' },
  { id: '4', name: 'Ana' },
];

const cacheta = (overrides: Partial<ParseContext> = {}): ParseContext => ({
  game: 'cacheta',
  locale: 'en-US',
  players: PLAYERS,
  ...overrides,
});

const fodinha = (overrides: Partial<ParseContext> = {}): ParseContext => ({
  game: 'fodinha',
  locale: 'en-US',
  players: PLAYERS,
  phase: 'betting',
  cardsInRound: 3,
  ...overrides,
});

/** Reduz os comandos a pares legíveis, para as asserções ficarem sobre o resultado. */
const summarize = (commands: VoiceCommand[]) =>
  commands.map((command) => {
    if (command.kind === 'cacheta.action') return [command.playerId, command.action];
    if (command.kind === 'fodinha.value') return [command.playerId, command.amount];
    if (command.kind === 'unresolved') return ['?', command.token];
    return [command.kind];
  });

// --- Cacheta: verbos ---

describe('parseCommand / en-US cacheta verbs', () => {
  it('maps each action verb family onto the game model', () => {
    expect(summarize(parseCommand('chris won', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('emma folded', cacheta()))).toEqual([['2', 'fold']]);
    expect(summarize(parseCommand('jon lost', cacheta()))).toEqual([['3', 'lost']]);
  });

  it('accepts the slang the table actually uses', () => {
    expect(summarize(parseCommand('chris beat everybody', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('emma bailed', cacheta()))).toEqual([['2', 'fold']]);
    expect(summarize(parseCommand('jon quit', cacheta()))).toEqual([['3', 'fold']]);
    expect(summarize(parseCommand('ana busted', cacheta()))).toEqual([['4', 'lost']]);
  });

  it('reads two-word verbs, where most of the English slang lives', () => {
    expect(summarize(parseCommand('chris dropped out', cacheta()))).toEqual([['1', 'fold']]);
    expect(summarize(parseCommand('emma gave up', cacheta()))).toEqual([['2', 'fold']]);
    expect(summarize(parseCommand('jon sat out', cacheta()))).toEqual([['3', 'fold']]);
    expect(summarize(parseCommand('ana paid up', cacheta()))).toEqual([['4', 'lost']]);
  });

  it('reads "went out" and "took it" as winning, the way rummy players say it', () => {
    expect(summarize(parseCommand('chris went out', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('emma took it', cacheta()))).toEqual([['2', 'won']]);
    expect(summarize(parseCommand('jon won the round', cacheta()))).toEqual([['3', 'won']]);
  });

  it('splits a list of names across one verb', () => {
    expect(summarize(parseCommand('chris and emma folded, jon won', cacheta()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'won'],
    ]);
  });

  it('accepts the verb before the names', () => {
    expect(summarize(parseCommand('folded emma and jon', cacheta()))).toEqual([
      ['2', 'fold'],
      ['3', 'fold'],
    ]);
  });
});

// --- Cacheta: quantificadores ---

describe('parseCommand / en-US quantifiers', () => {
  it('expands everyone / everybody / all to the whole table', () => {
    const table = [
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'fold'],
      ['4', 'fold'],
    ];
    expect(summarize(parseCommand('everyone folded', cacheta()))).toEqual(table);
    expect(summarize(parseCommand('everybody folded', cacheta()))).toEqual(table);
    expect(summarize(parseCommand('all folded', cacheta()))).toEqual(table);
  });

  it('expands "everyone else" / "the rest" to whoever was not named yet', () => {
    const expected = [
      ['1', 'won'],
      ['2', 'fold'],
      ['3', 'fold'],
      ['4', 'fold'],
    ];
    expect(summarize(parseCommand('chris won and everyone else folded', cacheta()))).toEqual(
      expected,
    );
    expect(summarize(parseCommand('chris won, the rest folded', cacheta()))).toEqual(expected);
    expect(summarize(parseCommand('chris won, the others folded', cacheta()))).toEqual(expected);
  });
});

// --- Fodinha ---

describe('parseCommand / en-US fodinha', () => {
  it('reads a bid announced with a verb', () => {
    expect(summarize(parseCommand('chris bet two', fodinha()))).toEqual([['1', 2]]);
    expect(summarize(parseCommand('emma bid one', fodinha()))).toEqual([['2', 1]]);
    expect(summarize(parseCommand('jon called zero', fodinha()))).toEqual([['3', 0]]);
  });

  it('reads a bare number, which is how bids are actually called out', () => {
    expect(summarize(parseCommand('chris two, emma one, jon zero', fodinha()))).toEqual([
      ['1', 2],
      ['2', 1],
      ['3', 0],
    ]);
  });

  it('steps over the auxiliaries English puts between name and verb', () => {
    expect(summarize(parseCommand('chris is gonna make two', fodinha()))).toEqual([['1', 2]]);
    expect(summarize(parseCommand('emma wants to make three', fodinha()))).toEqual([['2', 3]]);
  });

  it('reads every shape of zero, negation included', () => {
    expect(summarize(parseCommand('chris bet nothing', fodinha()))).toEqual([['1', 0]]);
    expect(summarize(parseCommand('chris made none', fodinha()))).toEqual([['1', 0]]);
    expect(summarize(parseCommand("chris didn't make any", fodinha()))).toEqual([['1', 0]]);
    expect(summarize(parseCommand('chris nil', fodinha()))).toEqual([['1', 0]]);
  });

  it('clamps a bid to the size of the round', () => {
    expect(summarize(parseCommand('chris bet ten', fodinha({ cardsInRound: 3 })))).toEqual([
      ['1', 3],
    ]);
  });

  it('reads a verb with no number as one more trick, but only in the results phase', () => {
    const [command] = parseCommand('chris made', fodinha({ phase: 'results' }));
    expect(command).toMatchObject({ kind: 'fodinha.value', playerId: '1', amount: 1, mode: 'add' });

    expect(parseCommand('chris made', fodinha({ phase: 'betting' }))).toEqual([
      { kind: 'unparsed', raw: 'chris made' },
    ]);
  });

  it('resolves a player by seat', () => {
    expect(summarize(parseCommand('player two makes three', fodinha()))).toEqual([['2', 3]]);
  });
});

// --- Controle ---

describe('parseCommand / en-US control phrases', () => {
  it('recognizes advance and undo on their own', () => {
    expect(parseCommand('next round', cacheta())).toEqual([{ kind: 'advance' }]);
    expect(parseCommand('lock it in', cacheta())).toEqual([{ kind: 'advance' }]);
    expect(parseCommand('undo', cacheta())).toEqual([{ kind: 'undo' }]);
    expect(parseCommand('scratch that', cacheta())).toEqual([{ kind: 'undo' }]);
  });

  it('picks them up mid-sentence, so a whole round fits in one breath', () => {
    expect(summarize(parseCommand('chris won, next round', cacheta()))).toEqual([
      ['1', 'won'],
      ['advance'],
    ]);
    expect(summarize(parseCommand('chris two, emma one, confirm bets', fodinha()))).toEqual([
      ['1', 2],
      ['2', 1],
      ['advance'],
    ]);
  });
});

// --- Recusa em vez de chute ---

describe('parseCommand / en-US rejects rather than guessing', () => {
  it('does not invent a command out of table talk', () => {
    expect(parseCommand('pass the beer', cacheta())).toEqual([
      { kind: 'unparsed', raw: 'pass the beer' },
    ]);
  });

  it('does not fire on a verb with nobody attached to it', () => {
    expect(parseCommand('he folded', cacheta())).toEqual([{ kind: 'unparsed', raw: 'he folded' }]);
  });

  it('queues an unrecognized name instead of dropping the whole clause', () => {
    const result = summarize(parseCommand('chris and mortimer folded', cacheta()));
    expect(result).toContainEqual(['1', 'fold']);
    expect(result.some(([id]) => id === '?')).toBe(true);
  });

  it('honors an alias learned by tap', () => {
    const context = cacheta({ aliases: { [normalizeToken('mortimer', 'en-US')]: '3' } });
    expect(summarize(parseCommand('mortimer won', context))).toEqual([['3', 'won']]);
  });
});

// --- Homófonos ---

describe('parseCommand / en-US homophone names', () => {
  const spelled = (name: string, spoken: string) => {
    const context = cacheta({ players: [{ id: 'x', name }] });
    return summarize(parseCommand(`${spoken} won`, context));
  };

  it('resolves the spelling the recognizer picked, not the one on the scoreboard', () => {
    expect(spelled('Chris', 'kris')).toEqual([['x', 'won']]);
    expect(spelled('Kathy', 'cathy')).toEqual([['x', 'won']]);
    expect(spelled('Jon', 'john')).toEqual([['x', 'won']]);
    expect(spelled('Sara', 'sarah')).toEqual([['x', 'won']]);
    expect(spelled('Megan', 'meghan')).toEqual([['x', 'won']]);
    expect(spelled('Marc', 'mark')).toEqual([['x', 'won']]);
  });

  it('keeps a name that only looks like a keyword', () => {
    // "Beth" sobrevive porque a dobra do "h" mudo pula o "th" — sem essa exceção viraria
    // "bet", o verbo de aposta, e o nome sumiria da fala.
    const context = cacheta({ players: [{ id: 'b', name: 'Beth' }] });
    expect(summarize(parseCommand('beth won', context))).toEqual([['b', 'won']]);
  });
});
