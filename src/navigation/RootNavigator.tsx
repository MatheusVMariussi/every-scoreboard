import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { type RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { TrucoScreen } from '../screens/TrucoScreen';
import { CachetaScreen } from '../screens/CachetaScreen';
import { CanastraScreen } from '../screens/CanastraScreen';
import { FodinhaScreen } from '../screens/FodinhaScreen';
import { TransitionScreen } from '../screens/TransitionScreen';
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
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ animation: 'fade', orientation: 'portrait_up' }}
      />

      <Stack.Screen
        name="Truco"
        component={TrucoScreen}
        options={{ animation: 'fade', orientation: 'portrait_up' }}
      />
      <Stack.Screen
        name="Cacheta"
        component={CachetaScreen}
        options={{ animation: 'fade', orientation: 'landscape', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Canastra"
        component={CanastraScreen}
        options={{ animation: 'fade', orientation: 'landscape', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Fodinha"
        component={FodinhaScreen}
        options={{ animation: 'fade', orientation: 'landscape', gestureEnabled: false }}
      />

      <Stack.Screen
        name="Transition"
        component={TransitionScreen}
        options={({ route }) => ({
          headerShown: false,
          animation: 'none',
          orientation: route.params.target === 'Home' ? 'portrait_up' : 'landscape',
        })}
      />
    </Stack.Navigator>
  );
};
