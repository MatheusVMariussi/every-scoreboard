import { createContext, type ReactNode, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { type Theme } from './types';
import { lightTheme } from './light';
import { darkTheme } from './dark';

interface ThemeContextProps {
  theme: Theme; //
  themeName: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();

  const [mode, setMode] = useState<'light' | 'dark'>(systemScheme === 'dark' ? 'dark' : 'light');

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, themeName: mode, toggleTheme }), [theme, mode, toggleTheme])}
    >
      {children}
    </ThemeContext.Provider>
  );
};
