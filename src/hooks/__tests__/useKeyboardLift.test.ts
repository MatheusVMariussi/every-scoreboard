import { getKeyboardLift } from '../useKeyboardLift';

// Paisagem de um iPhone: 402pt de altura. Card de 126pt centralizado: de 138 a 264.
const card = { top: 138, bottom: 264 };
const options = { gap: 10, minTop: 8 };

describe('getKeyboardLift', () => {
  it('lifts only by how much the card would sit under the keyboard', () => {
    // Teclado de 180pt: começa em 222. O fundo do card precisa ir para 212.
    expect(getKeyboardLift(card, 222, options)).toBe(52);
  });

  it('does not move a card that already fits above the keyboard', () => {
    expect(getKeyboardLift(card, 300, options)).toBe(0);
  });

  it('goes back to the centre when the keyboard closes', () => {
    // Fechando, o teclado termina fora da tela, com o topo na altura dela.
    expect(getKeyboardLift(card, 402, options)).toBe(0);
  });

  it('keeps the top of a card that cannot fit whole above the keyboard', () => {
    expect(getKeyboardLift(card, 100, options)).toBe(card.top - options.minTop);
  });

  it('never pushes a card down', () => {
    expect(getKeyboardLift({ top: 4, bottom: 300 }, 200, options)).toBe(0);
  });
});
