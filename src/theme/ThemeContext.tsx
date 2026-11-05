import { createContext, type ReactNode } from 'react';
import { type Theme } from './types';
import { darkTheme } from './dark';

interface ThemeContextProps {
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

/**
 * O app tem um tema só, o escuro: as telas de jogo são feltro escuro e o tema claro só
 * mudava a Home e os modais — e deixava texto escuro em cima do feltro.
 *
 * O contexto continua para os componentes seguirem lendo as cores por `useTheme()`.
 */
const VALUE: ThemeContextProps = { theme: darkTheme };

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>
);
