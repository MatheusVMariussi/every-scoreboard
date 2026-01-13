import React from 'react';
import { StatusBar, View, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle; // Permite passar estilos extras se necessário
}

export const ScreenWrapper = ({ children, style }: ScreenWrapperProps) => {
  const { theme, themeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle = {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingTop: insets.top, 
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <View style={[containerStyle, style]}>
      <StatusBar
        // Lógica automática: Fundo escuro -> Texto claro. Fundo claro -> Texto escuro.
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />
      {children}
    </View>
  );
};