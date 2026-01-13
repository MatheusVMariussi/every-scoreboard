import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { HomeScreenNavigationProp, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { GameButton } from '../components/GameButton';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { SettingsModal } from '../components/SettingsModal';

interface GameItem {
  id: string;
  labelKey: string;
  route: keyof RootStackParamList;
}

const GAMES: GameItem[] = [
  { id: '1', labelKey: 'home.truco', route: 'Truco' },
  { id: '2', labelKey: 'home.canastra', route: 'Canastra' },
  { id: '3', labelKey: 'home.fodinha', route: 'Fodinha' },
  { id: '4', labelKey: 'home.cacheta', route: 'Cacheta' },
];

export const HomeScreen = () => {
  useScreenOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  
  const { theme, toggleTheme, themeName } = useTheme(); 
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // ESTADO DO MODAL
  const [settingsVisible, setSettingsVisible] = useState(false);

  const iconColor = theme.colors.icon.secondary;
  const removeAdsColor = theme.colors.neon.secondary;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handlePress = (route: keyof RootStackParamList) => {
    navigation.navigate(route as any); 
  };

  // LINKANDO O BOTÃO
  const handleSettingsPress = () => setSettingsVisible(true);
  
  const handleRemoveAdsPress = () => console.log('Remover Ads');

  const titleStyle = {
    color: theme.colors.home.title,
    textShadowColor: theme.colors.home.titleOutline,
    textShadowOffset: { width: 2, height: 4 },
    textShadowRadius: 1,
  };

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground />

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
                    onPress={() => handlePress(item.route)}
                  />
                </View>
              )}
            />
          </View>
          
          <View style={[styles.footerSection, { marginTop: theme.spacing.m }]}>
            <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
              <Ionicons name="settings-sharp" size={28} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRemoveAdsPress} style={styles.iconButton}>
              <MaterialCommunityIcons name="diamond-stone" size={30} color={removeAdsColor} />
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>

      {/* COMPONENTE DO MODAL ADICIONADO AQUI */}
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
        toggleTheme={toggleTheme}
        isDarkMode={themeName === 'dark'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContainer: { flex: 1, flexDirection: 'column' },
  headerSection: { marginBottom: 30, alignItems: 'center', width: '100%', paddingTop: 20 },
  appTitle: { fontFamily: 'Minecraft', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 4 },
  listSection: { flex: 1, width: '100%' },
  listContent: { alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  buttonWrapper: { width: 280, height: 65 },
  footerSection: { height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 10 },
  iconButton: { padding: 10 }
});