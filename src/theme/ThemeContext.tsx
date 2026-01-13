import React, { createContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Theme } from './types';
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

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName: mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};