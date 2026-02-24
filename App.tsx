import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { View, ActivityIndicator, Text, TextInput } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import './src/i18n';

// Prevent Android system font/display zoom from compounding with our ms() scaling.
// ms() already handles responsive sizing — we don't want the OS to double-scale.
interface WithDefaultProps {
  defaultProps?: Record<string, unknown>;
}
(Text as unknown as WithDefaultProps).defaultProps = {
  ...(Text as unknown as WithDefaultProps).defaultProps,
  maxFontSizeMultiplier: 1,
};
(TextInput as unknown as WithDefaultProps).defaultProps = {
  ...(TextInput as unknown as WithDefaultProps).defaultProps,
  maxFontSizeMultiplier: 1,
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Minecraft: PressStart2P_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#090910',
        }}
      >
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
