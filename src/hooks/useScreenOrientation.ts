import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

export function useScreenOrientation(
  orientation: ScreenOrientation.OrientationLock = ScreenOrientation.OrientationLock.PORTRAIT_UP
) {
  useFocusEffect(
    useCallback(() => {
      const lockScreen = async () => {
        try {
          await ScreenOrientation.unlockAsync();
          
          if (Platform.OS === 'android') {
             await new Promise(resolve => setTimeout(resolve, 50));
          }

          await ScreenOrientation.lockAsync(orientation);
        } catch (error) {
          console.error('[Orientation Hook] Erro ao travar tela:', error);
        }
      };

      lockScreen();

      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [orientation])
  );
}