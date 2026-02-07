import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Truco: undefined;
  Cacheta: undefined;
  Canastra: undefined;
  Fodinha: undefined;
  Transition: { target: keyof RootStackParamList };
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;
