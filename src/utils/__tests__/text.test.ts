import { oneWordPerLine } from '../text';

describe('oneWordPerLine', () => {
  it('puts each word of a button label on its own line', () => {
    expect(oneWordPerLine('VER PLACAR')).toBe('VER\nPLACAR');
    expect(oneWordPerLine('NOVA PARTIDA')).toBe('NOVA\nPARTIDA');
  });

  it('ignores extra spaces and leaves single words alone', () => {
    expect(oneWordPerLine('  NEW   MATCH ')).toBe('NEW\nMATCH');
    expect(oneWordPerLine('OK')).toBe('OK');
  });
});
