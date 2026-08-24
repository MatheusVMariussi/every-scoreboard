import { createContext, type ReactNode, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { type Theme } from './types';
import { lightTheme } from './light';
import { darkTheme } from './dark';
import { type ThemeMode, updateSettings } from '../utils/appSettings';

interface ThemeContextProps {
  theme: Theme; //
  themeName: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Tema gravado, lido pelo `App` antes do primeiro render. `undefined` significa que o
   * usuário nunca escolheu — só aí seguimos o aparelho.
   */
  initialMode?: ThemeMode;
}

export const ThemeProvider = ({ children, initialMode }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();

  const [mode, setMode] = useState<ThemeMode>(
    initialMode ?? (systemScheme === 'dark' ? 'dark' : 'light'),
  );

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  const toggleTheme = useCallback(() => {
    // Calculado fora do updater: gravar dentro dele duplicaria a escrita sob StrictMode.
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    void updateSettings({ themeMode: next });
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, themeName: mode, toggleTheme }), [theme, mode, toggleTheme])}
    >
      {children}
    </ThemeContext.Provider>
  );
};
