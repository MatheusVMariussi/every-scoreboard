import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

export function useScreenOrientation(mode: 'PORTRAIT' | 'LANDSCAPE') {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const lockScreen = async () => {
        // Pequena espera para garantir que a animação de navegação iniciou/terminou
        // Isso evita o "congelamento" da UI durante a transição
        if (Platform.OS === 'ios') {
           await new Promise(resolve => setTimeout(resolve, 300));
        }

        if (mode === 'LANDSCAPE') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      };

      lockScreen();

      return () => {
        const unlock = async () => {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
        unlock();
      };
    }, [mode])
  );
}