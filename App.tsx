import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { View, ActivityIndicator, Text, TextInput } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { setLocale } from './src/i18n';
import { loadSettings } from './src/utils/appSettings';

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

  /**
   * `translate` é imperativo: as telas leem o idioma no render e não reagem a uma troca
   * depois. Por isso a preferência gravada tem de ser aplicada **antes** do primeiro
   * render — daí o portão, e não um efeito que corrige a tela já montada.
   */
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    let active = true;
    void loadSettings()
      .then((saved) => {
        if (!active) return;
        // Só substitui o idioma do aparelho quando houve escolha explícita.
        if (saved.locale !== null) setLocale(saved.locale);
        setSettingsReady(true);
      })
      .catch(() => {
        // Preferências ilegíveis não podem travar o app: segue o aparelho.
        if (active) setSettingsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!fontsLoaded || !settingsReady) {
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
      {/* Só existe o tema escuro: texto claro na barra de status em todas as telas. */}
      <StatusBar style="light" />
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
