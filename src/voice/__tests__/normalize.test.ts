import { normalizeJoined, normalizePhrase, normalizeToken, tokenize } from '../normalize';

describe('normalizeToken / pt-BR', () => {
  it('removes accents', () => {
    expect(normalizeToken('Léo', 'pt-BR')).toBe('leo');
    expect(normalizeToken('Tião', 'pt-BR')).toBe('tiao');
    expect(normalizeToken('João', 'pt-BR')).toBe('joao');
    expect(normalizeToken('Zé', 'pt-BR')).toBe('ze');
  });

  it('folds the digraphs pt-BR speech recognition swaps', () => {
    expect(normalizeToken('Thiago', 'pt-BR')).toBe('tiago');
    expect(normalizeToken('Philipe', 'pt-BR')).toBe('filipe');
    expect(normalizeToken('Guilherme', 'pt-BR')).toBe('guilerme');
    expect(normalizeToken('Junho', 'pt-BR')).toBe('juno');
  });

  it('drops the silent leading h', () => {
    expect(normalizeToken('Henrique', 'pt-BR')).toBe('enrike');
  });

  it('treats a final z as s', () => {
    expect(normalizeToken('Luiz', 'pt-BR')).toBe('luis');
    expect(normalizeToken('Luis', 'pt-BR')).toBe('luis');
  });

  it('collapses repeated letters', () => {
    expect(normalizeToken('Anna', 'pt-BR')).toBe('ana');
    expect(normalizeToken('Ana', 'pt-BR')).toBe('ana');
  });

  it('strips punctuation and returns empty for symbol-only input', () => {
    expect(normalizeToken('léo!', 'pt-BR')).toBe('leo');
    expect(normalizeToken('...', 'pt-BR')).toBe('');
  });

  it('keeps digits, which is how spoken numerals arrive', () => {
    expect(normalizeToken('2', 'pt-BR')).toBe('2');
  });
});

describe('tokenize', () => {
  it('splits on whitespace and punctuation', () => {
    expect(tokenize('léo, ana e tião correram')).toEqual(['léo', 'ana', 'e', 'tião', 'correram']);
  });

  it('returns an empty list for blank input', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('normalizeToken / en-US', () => {
  it('collapses the homophone name pairs the recognizer picks between', () => {
    expect(normalizeToken('Chris', 'en-US')).toBe(normalizeToken('Kris', 'en-US'));
    expect(normalizeToken('Cathy', 'en-US')).toBe(normalizeToken('Kathy', 'en-US'));
    expect(normalizeToken('John', 'en-US')).toBe(normalizeToken('Jon', 'en-US'));
    expect(normalizeToken('Sarah', 'en-US')).toBe(normalizeToken('Sara', 'en-US'));
    expect(normalizeToken('Meghan', 'en-US')).toBe(normalizeToken('Megan', 'en-US'));
    expect(normalizeToken('Marc', 'en-US')).toBe(normalizeToken('Mark', 'en-US'));
    expect(normalizeToken('Erik', 'en-US')).toBe(normalizeToken('Eric', 'en-US'));
    expect(normalizeToken('Zack', 'en-US')).toBe(normalizeToken('Zach', 'en-US'));
  });

  it('reads "c" as soft before e/i/y and hard everywhere else', () => {
    expect(normalizeToken('Cecil', 'en-US')).toBe('sesil');
    expect(normalizeToken('Carl', 'en-US')).toBe('karl');
  });

  it('keeps "th" intact, so keywords and names do not collide', () => {
    // Sem esta exceção "then" viraria "ten" (o número) e "Beth" viraria "bet" (o verbo).
    expect(normalizeToken('then', 'en-US')).not.toBe(normalizeToken('ten', 'en-US'));
    expect(normalizeToken('Beth', 'en-US')).not.toBe(normalizeToken('bet', 'en-US'));
  });

  it('keeps the leading h and the letter w, unlike pt-BR', () => {
    expect(normalizeToken('Harry', 'en-US')).toBe('hari');
    expect(normalizeToken('Wade', 'en-US')).toBe('wade');
  });

  it('still collapses doubled letters', () => {
    expect(normalizeToken('Jeff', 'en-US')).toBe('jef');
    expect(normalizeToken('Anna', 'en-US')).toBe(normalizeToken('Ana', 'en-US'));
  });
});

describe('normalizePhrase', () => {
  it('normalizes each word but keeps them separate', () => {
    expect(normalizePhrase('Próxima Rodada', 'pt-BR')).toBe('proxima rodada');
    expect(normalizePhrase('Next Round', 'en-US')).toBe('next round');
  });
});

describe('normalizeJoined', () => {
  it('joins multi-word names into a single key', () => {
    expect(normalizeJoined(['Ana', 'Paula'], 'pt-BR')).toBe('anapaula');
  });
});
