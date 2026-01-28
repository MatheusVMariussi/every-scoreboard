import { useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';

export function useScreenOrientation(mode: 'PORTRAIT' | 'LANDSCAPE') {
  useFocusEffect(
    useCallback(() => {
      // Função unificada para travar a tela
      const lockScreen = async () => {
        // Pequeno delay para garantir que a UI esteja pronta para receber o comando
        // Reduzi para 10ms para ser quase instantâneo ao voltar do background
        await new Promise(resolve => setTimeout(resolve, 10));

        if (mode === 'LANDSCAPE') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      };

      // 1. Trava ao entrar na tela (Navegação)
      lockScreen();

      // 2. Trava ao voltar do Background (Minimizar/Maximizar)
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          lockScreen();
        }
      });

      return () => {
        subscription.remove();
      };
    }, [mode])
  );
}