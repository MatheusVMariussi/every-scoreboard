import ptBR from '../pt-BR';
import en from '../en';

/** Achata o objeto de traduções em caminhos como `fodinha.help.title`. */
const collectKeys = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    collectKeys(child, prefix === '' ? key : `${prefix}.${key}`),
  );
};

describe('locales', () => {
  // Os dois arquivos não são ligados por tipo: uma chave esquecida só aparece em tela,
  // como o texto cru da chave.
  it('pt-BR and en define the same keys', () => {
    expect(collectKeys(en).sort()).toEqual(collectKeys(ptBR).sort());
  });
});
