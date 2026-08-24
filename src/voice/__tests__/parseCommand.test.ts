import { normalizeToken } from '../normalize';
import { parseCommand } from '../parseCommand';
import type { ParseContext, RosterPlayer, VoiceCommand } from '../types';

const PLAYERS: RosterPlayer[] = [
  { id: '1', name: 'Léo' },
  { id: '2', name: 'Ana' },
  { id: '3', name: 'Tião' },
  { id: '4', name: 'Zé' },
];

const cacheta = (overrides: Partial<ParseContext> = {}): ParseContext => ({
  game: 'cacheta',
  locale: 'pt-BR',
  players: PLAYERS,
  ...overrides,
});

const fodinha = (overrides: Partial<ParseContext> = {}): ParseContext => ({
  game: 'fodinha',
  locale: 'pt-BR',
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

describe('parseCommand / cacheta verbs', () => {
  it('maps each action verb family onto the game model', () => {
    expect(summarize(parseCommand('léo ganhou', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('léo correu', cacheta()))).toEqual([['1', 'fold']]);
    expect(summarize(parseCommand('léo perdeu', cacheta()))).toEqual([['1', 'lost']]);
  });

  it('accepts synonyms and plural conjugations', () => {
    expect(summarize(parseCommand('léo bateu', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('léo venceu', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('léo fugiu', cacheta()))).toEqual([['1', 'fold']]);
    expect(summarize(parseCommand('léo pagou', cacheta()))).toEqual([['1', 'lost']]);
  });

  it('handles multiple subjects sharing one verb', () => {
    expect(summarize(parseCommand('léo, ana e tião correram', cacheta()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'fold'],
    ]);
  });

  it('handles two clauses in one utterance', () => {
    expect(summarize(parseCommand('léo e ana correram, o zé ganhou', cacheta()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['4', 'won'],
    ]);
  });

  it('ignores articles and speech filler around names', () => {
    expect(summarize(parseCommand('então o léo ali perdeu', cacheta()))).toEqual([['1', 'lost']]);
  });
});

// --- Cacheta: nomes ---

describe('parseCommand / name resolution', () => {
  it('resolves names the recognizer stripped of accents', () => {
    expect(summarize(parseCommand('tiao ganhou', cacheta()))).toEqual([['3', 'won']]);
    expect(summarize(parseCommand('ze correu', cacheta()))).toEqual([['4', 'fold']]);
  });

  it('resolves plausible mis-transcriptions', () => {
    expect(summarize(parseCommand('thiago ganhou', cacheta()))).toEqual([['3', 'won']]);
    expect(summarize(parseCommand('zeh correu', cacheta()))).toEqual([['4', 'fold']]);
  });

  it('keeps the good names when one in the list cannot be resolved', () => {
    const result = summarize(parseCommand('léo, ana e fulano correram', cacheta()));

    expect(result).toContainEqual(['1', 'fold']);
    expect(result).toContainEqual(['2', 'fold']);
    expect(result).toContainEqual(['?', 'fulano']);
  });

  it('carries the intent on an unresolved name so a tap can complete it', () => {
    const [command] = parseCommand('fulano ganhou', cacheta());

    expect(command).toMatchObject({
      kind: 'unresolved',
      token: 'fulano',
      intent: { game: 'cacheta', action: 'won' },
    });
  });

  it('resolves a learned session alias that fuzzy matching alone would reject', () => {
    expect(parseCommand('fulano ganhou', cacheta())[0].kind).toBe('unresolved');

    const context = cacheta({ aliases: { [normalizeToken('fulano', 'pt-BR')]: '4' } });
    expect(summarize(parseCommand('fulano ganhou', context))).toEqual([['4', 'won']]);
  });

  it('resolves a diminutive, but marks it as low confidence', () => {
    // "Zezinho" é o diminutivo de "Zé" — o peso no prefixo do Jaro-Winkler pega isso.
    // Resolver está certo; o que não pode é resolver com cara de certeza.
    const [command] = parseCommand('zezinho ganhou', cacheta());

    expect(command).toMatchObject({ kind: 'cacheta.action', playerId: '4', action: 'won' });
    if (command.kind === 'cacheta.action') {
      expect(command.confidence).toBeLessThan(0.86);
      expect(command.confidence).toBeGreaterThan(0.7);
    }
  });

  it('never resolves to the wrong player when two names collide', () => {
    const context = cacheta({
      players: [
        { id: 'a', name: 'Marcos' },
        { id: 'b', name: 'Marco' },
      ],
    });
    const [command] = parseCommand('marcus ganhou', context);

    expect(command.kind).toBe('unresolved');
  });

  it('resolves multi-word names as one player', () => {
    const context = cacheta({
      players: [
        { id: 'a', name: 'Ana' },
        { id: 'b', name: 'Ana Paula' },
      ],
    });

    expect(summarize(parseCommand('ana paula ganhou', context))).toEqual([['b', 'won']]);
    expect(summarize(parseCommand('ana ganhou', context))).toEqual([['a', 'won']]);
  });

  it('falls back to table position, which is also the default player naming', () => {
    expect(summarize(parseCommand('jogador um ganhou', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('jogador 2 correu', cacheta()))).toEqual([['2', 'fold']]);
    expect(summarize(parseCommand('o jogador três perdeu', cacheta()))).toEqual([['3', 'lost']]);
  });
});

// --- Fodinha ---

describe('parseCommand / fodinha', () => {
  it('reads a spoken bid', () => {
    expect(summarize(parseCommand('léo apostou dois', fodinha()))).toEqual([['1', 2]]);
  });

  it('accepts the verbs used in the results phase', () => {
    const context = fodinha({ phase: 'results' });
    expect(summarize(parseCommand('ana fez três', context))).toEqual([['2', 3]]);
    expect(summarize(parseCommand('ana ganhou duas', context))).toEqual([['2', 2]]);
  });

  it('understands "meia" as six', () => {
    const context = fodinha({ cardsInRound: 7 });
    expect(summarize(parseCommand('léo apostou meia', context))).toEqual([['1', 6]]);
  });

  it('accepts spoken digits', () => {
    expect(summarize(parseCommand('léo apostou 2', fodinha()))).toEqual([['1', 2]]);
  });

  it('reads zero', () => {
    expect(summarize(parseCommand('tião apostou zero', fodinha()))).toEqual([['3', 0]]);
  });

  it('clamps to the round size, so the queue shows what will actually be applied', () => {
    expect(summarize(parseCommand('léo apostou dez', fodinha({ cardsInRound: 3 })))).toEqual([
      ['1', 3],
    ]);
  });

  it('applies one value to several players', () => {
    expect(summarize(parseCommand('léo e ana apostaram um', fodinha()))).toEqual([
      ['1', 1],
      ['2', 1],
    ]);
  });

  it('handles two bids in one utterance', () => {
    expect(summarize(parseCommand('léo apostou dois e ana apostou zero', fodinha()))).toEqual([
      ['1', 2],
      ['2', 0],
    ]);
  });

  it('ignores a value verb with no number rather than inventing one', () => {
    expect(parseCommand('léo apostou', fodinha())).toEqual([
      { kind: 'unparsed', raw: 'léo apostou' },
    ]);
  });
});

// --- Controle e entradas ruins ---

describe('parseCommand / control phrases', () => {
  it('recognizes round advance', () => {
    expect(parseCommand('próxima rodada', cacheta())).toEqual([{ kind: 'advance' }]);
    expect(parseCommand('finalizar rodada', fodinha())).toEqual([{ kind: 'advance' }]);
  });

  it('recognizes undo', () => {
    expect(parseCommand('desfazer', cacheta())).toEqual([{ kind: 'undo' }]);
  });
});

describe('parseCommand / rejects rather than guessing', () => {
  it('returns unparsed for speech with no verb', () => {
    expect(parseCommand('passa a cerveja', cacheta())).toEqual([
      { kind: 'unparsed', raw: 'passa a cerveja' },
    ]);
  });

  it('returns nothing for empty or symbol-only input', () => {
    expect(parseCommand('', cacheta())).toEqual([]);
    expect(parseCommand('   ', cacheta())).toEqual([]);
    expect(parseCommand('...', cacheta())).toEqual([]);
  });

  it('never emits a score change from a verb with no subject', () => {
    const commands = parseCommand('ganhou', cacheta());
    expect(commands.every((command) => command.kind === 'unparsed')).toBe(true);
  });
});

// --- Ordem invertida, quantificadores e comandos combinados ---

describe('parseCommand / verb-first order', () => {
  it('accepts the verb before the name', () => {
    expect(summarize(parseCommand('ganhou o zé', cacheta()))).toEqual([['4', 'won']]);
    expect(summarize(parseCommand('correu a ana', cacheta()))).toEqual([['2', 'fold']]);
  });

  it('keeps each clause with its own verb when both come first', () => {
    expect(summarize(parseCommand('ganhou o léo, correu a ana', cacheta()))).toEqual([
      ['1', 'won'],
      ['2', 'fold'],
    ]);
  });

  it('handles verb-first with several names', () => {
    expect(summarize(parseCommand('correram o léo, a ana e o tião', cacheta()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'fold'],
    ]);
  });

  it('still handles the normal subject-verb order', () => {
    expect(summarize(parseCommand('léo ganhou e ana correu', cacheta()))).toEqual([
      ['1', 'won'],
      ['2', 'fold'],
    ]);
  });
});

describe('parseCommand / compound verbs', () => {
  it('understands multi-word fold expressions', () => {
    expect(summarize(parseCommand('léo pulou fora', cacheta()))).toEqual([['1', 'fold']]);
    expect(summarize(parseCommand('léo caiu fora', cacheta()))).toEqual([['1', 'fold']]);
    expect(summarize(parseCommand('léo deu no pé', cacheta()))).toEqual([['1', 'fold']]);
  });

  it('understands multi-word win expressions without leaving the filler stranded', () => {
    // "rodada" não pode sobrar procurando um jogador.
    expect(summarize(parseCommand('léo ganhou a rodada', cacheta()))).toEqual([['1', 'won']]);
    expect(summarize(parseCommand('léo bateu a mão', cacheta()))).toEqual([['1', 'won']]);
  });

  it('accepts more synonyms for each action', () => {
    expect(summarize(parseCommand('léo desistiu', cacheta()))).toEqual([['1', 'fold']]);
    expect(summarize(parseCommand('léo passou', cacheta()))).toEqual([['1', 'fold']]);
    expect(summarize(parseCommand('léo tomou', cacheta()))).toEqual([['1', 'lost']]);
    expect(summarize(parseCommand('léo matou', cacheta()))).toEqual([['1', 'won']]);
  });
});

describe('parseCommand / quantifiers', () => {
  it('expands "todo mundo" to the whole table', () => {
    expect(summarize(parseCommand('todo mundo correu', cacheta()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'fold'],
      ['4', 'fold'],
    ]);
  });

  it('expands "o resto" to everyone not already named in the utterance', () => {
    expect(summarize(parseCommand('léo ganhou e o resto perdeu', cacheta()))).toEqual([
      ['1', 'won'],
      ['2', 'lost'],
      ['3', 'lost'],
      ['4', 'lost'],
    ]);
  });

  it('treats "os outros" the same way', () => {
    expect(summarize(parseCommand('zé ganhou, os outros correram', cacheta()))).toEqual([
      ['4', 'won'],
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'fold'],
    ]);
  });
});

describe('parseCommand / control phrases inside a sentence', () => {
  it('picks up the round advance spoken after a scoring command', () => {
    const commands = parseCommand('léo ganhou, próxima rodada', cacheta());

    expect(summarize(commands)).toEqual([['1', 'won'], ['advance']]);
  });

  it('picks up advance after a quantifier clause', () => {
    const commands = parseCommand('léo ganhou o resto perdeu pode aplicar', cacheta());

    expect(commands.filter((c) => c.kind === 'advance')).toHaveLength(1);
    expect(commands.filter((c) => c.kind === 'cacheta.action')).toHaveLength(4);
  });

  it('still recognizes a bare control phrase', () => {
    expect(parseCommand('próxima rodada', cacheta())).toEqual([{ kind: 'advance' }]);
    expect(parseCommand('desfazer', cacheta())).toEqual([{ kind: 'undo' }]);
  });
});

// --- Frase longa com várias pessoas de uma vez ---

describe('parseCommand / a whole round in one breath', () => {
  const table = (): ParseContext => ({
    game: 'cacheta',
    locale: 'pt-BR',
    players: [
      { id: '1', name: 'Matheus' },
      { id: '2', name: 'João' },
      { id: '3', name: 'Noelle' },
      { id: '4', name: 'Ana' },
    ],
  });

  it('handles three named clauses plus a quantifier for everyone else', () => {
    const spoken = 'matheus correu, joão correu, noelle ganhou, o resto perdeu';

    expect(summarize(parseCommand(spoken, table()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'won'],
      ['4', 'lost'],
    ]);
  });

  it('groups the two folds when they share one verb', () => {
    const spoken = 'matheus e joão correram, noelle ganhou, o resto perdeu';

    expect(summarize(parseCommand(spoken, table()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'won'],
      ['4', 'lost'],
    ]);
  });

  it('closes the round when the advance is spoken in the same breath', () => {
    const spoken = 'matheus correu, noelle ganhou, o resto perdeu, próxima rodada';
    const commands = parseCommand(spoken, table());

    expect(commands.filter((c) => c.kind === 'cacheta.action')).toHaveLength(4);
    expect(commands.at(-1)).toEqual({ kind: 'advance' });
  });

  it('survives the recognizer mangling one name in a long sentence', () => {
    const spoken = 'mateus correu, joao correu, noele ganhou';

    expect(summarize(parseCommand(spoken, table()))).toEqual([
      ['1', 'fold'],
      ['2', 'fold'],
      ['3', 'won'],
    ]);
  });
});

// --- Fodinha: fala natural ---

describe('parseCommand / fodinha natural speech', () => {
  const table = (overrides: Partial<ParseContext> = {}): ParseContext => ({
    game: 'fodinha',
    locale: 'pt-BR',
    players: [
      { id: '1', name: 'Matheus' },
      { id: '2', name: 'João' },
      { id: '3', name: 'Noelle' },
      { id: '4', name: 'Ana' },
    ],
    phase: 'betting',
    cardsInRound: 5,
    ...overrides,
  });

  it('understands the auxiliary + infinitive form', () => {
    expect(summarize(parseCommand('matheus vai fazer três', table()))).toEqual([['1', 3]]);
    expect(summarize(parseCommand('joão quer apostar duas', table()))).toEqual([['2', 2]]);
    expect(summarize(parseCommand('noelle vai pedir uma', table()))).toEqual([['3', 1]]);
  });

  it('ignores trailing "vazas"', () => {
    expect(summarize(parseCommand('matheus vai fazer duas vazas', table()))).toEqual([['1', 2]]);
  });

  it('accepts a bare name and number, with no verb at all', () => {
    expect(summarize(parseCommand('matheus dois', table()))).toEqual([['1', 2]]);
  });

  it('reads a whole round of bids in one breath', () => {
    const spoken = 'matheus dois, joão um, noelle zero, ana três';

    expect(summarize(parseCommand(spoken, table()))).toEqual([
      ['1', 2],
      ['2', 1],
      ['3', 0],
      ['4', 3],
    ]);
  });

  it('mixes spoken verbs and bare numbers in the same sentence', () => {
    const spoken = 'matheus vai fazer dois, joão um, noelle fez zero';

    expect(summarize(parseCommand(spoken, table()))).toEqual([
      ['1', 2],
      ['2', 1],
      ['3', 0],
    ]);
  });

  it('applies a quantifier to everyone left', () => {
    const spoken = 'matheus vai fazer três, o resto zero';

    expect(summarize(parseCommand(spoken, table()))).toEqual([
      ['1', 3],
      ['2', 0],
      ['3', 0],
      ['4', 0],
    ]);
  });

  it('closes the round when the advance is spoken in the same breath', () => {
    const commands = parseCommand('matheus dois, joão um, confirmar apostas', table());

    expect(commands.filter((c) => c.kind === 'fodinha.value')).toHaveLength(2);
    expect(commands.at(-1)).toEqual({ kind: 'advance' });
  });

  it('keeps positional references working despite the bare-number shortcut', () => {
    // "jogador dois" é o jogador 2, não uma aposta de 2.
    expect(summarize(parseCommand('jogador dois vai fazer três', table()))).toEqual([['2', 3]]);
  });

  it('still clamps a bare number to the round size', () => {
    expect(summarize(parseCommand('matheus nove', table({ cardsInRound: 3 })))).toEqual([['1', 3]]);
  });

  it('does not turn a stray number into a bid for nobody', () => {
    expect(parseCommand('três', table())).toEqual([{ kind: 'unparsed', raw: 'três' }]);
  });
});

describe('parseCommand / fodinha zero forms', () => {
  const table = (): ParseContext => ({
    game: 'fodinha',
    locale: 'pt-BR',
    players: [
      { id: '1', name: 'Matheus' },
      { id: '2', name: 'João' },
    ],
    phase: 'betting',
    cardsInRound: 5,
  });

  it('reads "nada" as zero', () => {
    expect(summarize(parseCommand('matheus vai fazer nada', table()))).toEqual([['1', 0]]);
    expect(summarize(parseCommand('matheus fez nada', table()))).toEqual([['1', 0]]);
  });

  it('reads the negated forms as zero too', () => {
    expect(summarize(parseCommand('matheus não vai fazer nada', table()))).toEqual([['1', 0]]);
    expect(summarize(parseCommand('matheus não fez nada', table()))).toEqual([['1', 0]]);
    expect(summarize(parseCommand('joão não vai pedir nada', table()))).toEqual([['2', 0]]);
  });

  it('still reads the plain zero words', () => {
    expect(summarize(parseCommand('matheus vai fazer zero', table()))).toEqual([['1', 0]]);
    expect(summarize(parseCommand('matheus vai fazer nenhuma', table()))).toEqual([['1', 0]]);
  });
});
