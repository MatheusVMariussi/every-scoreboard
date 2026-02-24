import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePreventRemove } from '@react-navigation/core';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RootStackParamList } from '../navigation/types';

/**
 * Intercepts back navigation and routes through TransitionScreen
 * so the rotation back to portrait happens behind a loading screen.
 * Use only on landscape game screens (Cacheta, Canastra, Fodinha).
 */
export function useTransitionBack() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [shouldPrevent, setShouldPrevent] = useState(true);

  usePreventRemove(shouldPrevent, () => {
    setShouldPrevent(false);
    navigation.navigate('Transition', { target: 'Home' });
  });
}
