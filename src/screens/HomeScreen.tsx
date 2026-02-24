import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import VersionCheck from 'react-native-version-check';

import { type HomeScreenNavigationProp, type GameScreen } from '../navigation/types';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { GameButton } from '../components/GameButton';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { SettingsModal } from '../components/SettingsModal';
import { RateModal } from '../components/RateModal';
import { ms } from '../theme/responsive';

interface GameItem {
  id: string;
  labelKey: string;
  route: GameScreen;
  comingSoon?: boolean;
}

const GAMES: GameItem[] = [
  { id: '1', labelKey: 'home.truco', route: 'Truco' },
  { id: '2', labelKey: 'home.fodinha', route: 'Fodinha' },
  { id: '3', labelKey: 'home.cacheta', route: 'Cacheta' },
  { id: '4', labelKey: 'home.canastra', route: 'Canastra', comingSoon: true },
];

export const HomeScreen = () => {
  const { theme, toggleTheme, themeName } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [rateModalVisible, setRateModalVisible] = useState(false);

  const screenOpacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const iconColor = theme.colors.icon.secondary;
  const removeAdsColor = theme.colors.neon.secondary;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const checkUpdate = async () => {
      if (__DEV__) return;

      try {
        const updateNeeded = await VersionCheck.needUpdate();

        if (updateNeeded?.isNeeded) {
          Alert.alert(translate('home.update_title'), translate('home.update_message'), [
            { text: translate('home.cancel'), style: 'cancel' },
            {
              text: translate('home.update_now'),
              onPress: () => {
                void Linking.openURL(updateNeeded.storeUrl);
              },
            },
          ]);
        }
      } catch (error) {
        console.log('Erro update:', error);
      }
    };
    void checkUpdate();
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (height > width) {
      screenOpacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      });
    }
  };

  const handlePress = (route: GameScreen) => {
    if (route === 'Truco') {
      navigation.navigate('Truco');
    } else {
      navigation.navigate('Transition', { target: route });
    }
  };

  const handleSettingsPress = () => {
    setSettingsVisible(true);
  };

  const handleRemoveAdsPress = () => {
    setRateModalVisible(true);
  };

  const titleStyle = {
    color: theme.colors.home.title,
    textShadowColor: theme.colors.home.titleOutline,
    textShadowOffset: { width: 2, height: 4 },
    textShadowRadius: 1,
  };

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground />

      <Animated.View style={[styles.safeArea, animatedStyle]} onLayout={handleLayout}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.mainContainer, { padding: theme.spacing.m }]}>
            <View style={styles.headerSection}>
              <Text style={[styles.appTitle, titleStyle]}>
                {translate('home.title').toUpperCase()}
              </Text>
            </View>

            <View style={styles.listSection}>
              <FlatList
                data={GAMES}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={[styles.buttonWrapper, { marginBottom: theme.spacing.m }]}>
                    <GameButton
                      title={translate(item.labelKey)}
                      onPress={() => {
                        handlePress(item.route);
                      }}
                      disabled={item.comingSoon}
                      badge={item.comingSoon ? translate('home.coming_soon') : undefined}
                    />
                  </View>
                )}
              />
            </View>

            {/* FOOTER COM OS DOIS ÍCONES */}
            <View style={[styles.footerSection, { marginTop: theme.spacing.m }]}>
              <TouchableOpacity
                onPress={handleSettingsPress}
                style={styles.iconButton}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="settings-sharp" size={ms(28)} color={iconColor} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRemoveAdsPress}
                style={styles.iconButton}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <MaterialCommunityIcons name="diamond-stone" size={ms(30)} color={removeAdsColor} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => {
          setSettingsVisible(false);
        }}
        toggleTheme={toggleTheme}
        isDarkMode={themeName === 'dark'}
      />

      <RateModal
        visible={rateModalVisible}
        onClose={() => {
          setRateModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContainer: { flex: 1, flexDirection: 'column' },
  headerSection: { marginBottom: ms(30), alignItems: 'center', width: '100%', paddingTop: ms(20) },
  appTitle: {
    fontFamily: 'Minecraft',
    fontSize: ms(28),
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: ms(4),
  },
  listSection: { flex: 1, width: '100%' },
  listContent: { alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  buttonWrapper: { width: ms(280), height: ms(65) },
  footerSection: {
    height: ms(60),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: ms(10),
    zIndex: 10,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  iconButton: { padding: ms(10) },
});
