import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type GameScreen = 'Truco' | 'Cacheta' | 'Canastra' | 'Fodinha';
export type TransitionTarget = GameScreen | 'Home';

export type RootStackParamList = {
  Home: undefined;
  Truco: undefined;
  Cacheta: undefined;
  Canastra: undefined;
  Fodinha: undefined;
  Transition: { target: TransitionTarget };
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;
