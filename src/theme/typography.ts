import { ms } from './responsive';

export const typography = {
  sizes: {
    title: ms(24),
    body: ms(16),
    caption: ms(12),
  },
  weights: {
    regular: '400',
    bold: '700',
  },
} as const;
