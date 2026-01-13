import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { TrucoScreen } from '../screens/TrucoScreen';
import { CachetaScreen } from '../screens/CachetaScreen';
import { CanastraScreen } from '../screens/CanastraScreen';
import { FodinhaScreen } from '../screens/FodinhaScreen';
import { useTheme } from '../theme/useTheme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      id="RootNavigator"
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background.primary,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: theme.colors.background.secondary,
        },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="Truco" component={TrucoScreen} />
      <Stack.Screen name="Cacheta" component={CachetaScreen} />
      <Stack.Screen name="Canastra" component={CanastraScreen} />
      <Stack.Screen name="Fodinha" component={FodinhaScreen} />
    </Stack.Navigator>
  );
};