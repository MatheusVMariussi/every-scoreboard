import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { TrucoSettingsModal } from '../components/TrucoSettingsModal';
import { EditNameModal } from '../components/EditNameModal';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { MatchHistoryGraph, HistoryItem } from '../components/MatchHistoryGraph';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { useTutorialTarget } from '../hooks/useTutorialTarget';

export const TrucoScreen = () => {
  useScreenOrientation('PORTRAIT');
  
  const { theme } = useTheme();
  const navigation = useNavigation();

  // CORES DOS TIMES
  const COLOR_THEM = theme.colors.truco.teamThem;
  const COLOR_US = theme.colors.truco.teamUs;

  // --- ESTADOS ---
  const [scoreUs, setScoreUs] = useState(0);
  const [scoreThem, setScoreThem] = useState(0);
  
  // Configurações do Jogo
  const [gameMode, setGameMode] = useState<'paulista' | 'mineiro'>('paulista');
  const [maxScore, setMaxScore] = useState(12);
  
  // Metadados
  const [matchWinsUs, setMatchWinsUs] = useState(0);
  const [matchWinsThem, setMatchWinsThem] = useState(0);
  const [pointHistory, setPointHistory] = useState<HistoryItem[]>([]);
  const [nameUs, setNameUs] = useState(translate('truco.us'));
  const [nameThem, setNameThem] = useState(translate('truco.them'));
  
  // Modais
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<'us' | 'them'>('us');
  const [isLoaded, setIsLoaded] = useState(false);

  // Tutorial State
  const [tutorialActive, setTutorialActive] = useState(false);

  // Custom hooks for targeting
  const scoreTarget = useTutorialTarget(tutorialActive);

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  // --- PERSISTÊNCIA ---
  useEffect(() => {
    const checkTutorial = async () => {
      const hasSeen = await getData(STORAGE_KEYS.TUTORIAL_TRUCO);
      if (!hasSeen) {
        setTutorialActive(true);
      }
    };
    checkTutorial();

    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.TRUCO_DATA);
      if (saved) {
        setScoreUs(saved.scoreUs); setScoreThem(saved.scoreThem);
        setGameMode(saved.gameMode);
        if (saved.maxScore) setMaxScore(saved.maxScore);
        
        setMatchWinsUs(saved.matchWinsUs); setMatchWinsThem(saved.matchWinsThem);
        setPointHistory(saved.pointHistory); setNameUs(saved.nameUs); setNameThem(saved.nameThem);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData(STORAGE_KEYS.TRUCO_DATA, { 
        scoreUs, scoreThem, gameMode, maxScore,
        matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem 
      });
    }
  }, [scoreUs, scoreThem, gameMode, maxScore, matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem, isLoaded]);

  useEffect(() => { 
    if (isLoaded && scoreUs === 0 && scoreThem === 0) resetGame(true); 
  }, [gameMode, maxScore]);

  // --- TUTORIAL LOGIC ---
  const finishTutorial = async () => {
      setTutorialActive(false);
      await saveData(STORAGE_KEYS.TUTORIAL_TRUCO, true);
  };

  // --- LÓGICA DE PONTUAÇÃO ---
  const getBasePoints = () => gameMode === 'paulista' ? 1 : 2;

  const resetGame = (fullReset = false) => {
    setScoreUs(0); setScoreThem(0);
    setPointHistory([]);
    if (fullReset) { setMatchWinsUs(0); setMatchWinsThem(0); }
  };

  const handlePointChange = (team: 'us' | 'them', pointsToAdd: number) => {

    setPointHistory(prev => {
      const newHist = [...prev];
      if (pointsToAdd > 0) {
        newHist.push({ team, points: pointsToAdd });
      } else {
        let foundIndex = -1;
        for (let i = newHist.length - 1; i >= 0; i--) { 
            if (newHist[i].team === team) { foundIndex = i; break; } 
        }
        
        if (foundIndex !== -1) {
          const currentPoints = newHist[foundIndex].points;
          const base = getBasePoints();
          
          if (currentPoints > base && Math.abs(pointsToAdd) === base) {
             newHist[foundIndex] = { ...newHist[foundIndex], points: currentPoints - base };
          } else {
             newHist.splice(foundIndex, 1);
          }
        }
      }
      return newHist;
    });

    if (team === 'us') {
      const newScore = Math.max(0, scoreUs + pointsToAdd);
      if (newScore >= maxScore && pointsToAdd > 0) { 
        handleVictory(nameUs, 'us'); 
        setScoreUs(maxScore); 
      } else {
        setScoreUs(newScore);
      }
    } else {
      const newScore = Math.max(0, scoreThem + pointsToAdd);
      if (newScore >= maxScore && pointsToAdd > 0) { 
        handleVictory(nameThem, 'them'); 
        setScoreThem(maxScore); 
      } else {
        setScoreThem(newScore);
      }
    }
  };

  const handleVictory = (winnerName: string, winnerTeam: 'us' | 'them') => {
    if (winnerTeam === 'us') setMatchWinsUs(prev => Math.min(prev + 1, 5));
    else setMatchWinsThem(prev => Math.min(prev + 1, 5));
    
    setTimeout(() => {
      Alert.alert(
        translate('common.game_over'), 
        translate('common.winner_text', { team: winnerName }), 
        [
            { text: translate('common.cancel'), style: "cancel" },
            { text: translate('common.new_match'), onPress: () => resetGame(false) }
        ]
      );
    }, 100);
  };

  // --- COMPONENTES VISUAIS INTERNOS ---
  const TeamScoreArea = ({ team, score, name, wins, color, scoreTargetProp, nameTargetProp }: any) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value }, 
        { translateY: translateY.value }
      ] as any,
    }));

    const baseValue = getBasePoints();
    const trucoValue = gameMode === 'paulista' ? 3 : 4;

    const gesture = Gesture.Race(
      Gesture.Pan()
        .onUpdate((e) => { translateY.value = e.translationY * 0.1; })
        .onEnd((e) => {
          if (e.translationY < -40) {
             scheduleOnRN(handlePointChange, team, trucoValue); 
          } else if (e.translationY > 40) {
             scheduleOnRN(handlePointChange, team, -baseValue);
          }
          translateY.value = withSpring(0);
        }),
      Gesture.Tap()
        .onStart(() => { scale.value = withSpring(0.95); })
        .onEnd(() => { 
            scale.value = withSpring(1); 
            scheduleOnRN(handlePointChange, team, baseValue);
        })
    );

    return (
      <View style={styles.teamColumn}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />

        <View>
            <TouchableOpacity
                onPress={() => { setEditingTeam(team); setEditNameVisible(true); }}
                style={styles.nameContainer}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            >
                <Text style={[styles.teamName, { color: theme.colors.text.inverse }]}>
                    {name} <Ionicons name="pencil" size={12} color={theme.colors.text.secondary} />
                </Text>
                <View style={styles.trophyContainer}>
                    {Array.from({ length: wins }).map((_, i) => (
                        <Ionicons key={i} name="trophy" size={12} color={color} />
                    ))}
                </View>
            </TouchableOpacity>
        </View>

        <GestureDetector gesture={gesture}>
          <View style={styles.gestureArea} collapsable={false}>
             <Animated.View style={[styles.scoreContainer, animatedStyle]}>
                <View ref={scoreTargetProp?.ref} collapsable={false}>
                  <Text style={[styles.scoreNumber, { color: theme.colors.truco.scoreText }]}>
                    {score.toString().padStart(2, '0')}
                  </Text>
                </View>

                <View style={styles.hintsOverlay}>
                   <View style={styles.hintBox}>
                      <Ionicons name="chevron-up" size={16} color={theme.colors.truco.divider} />
                      <Text style={[styles.hintText, { color: theme.colors.text.white }]}>+{trucoValue}</Text>
                   </View>
                   <View style={styles.hintBox}>
                      <Text style={[styles.hintText, { color: theme.colors.text.white }]}>-{baseValue}</Text>
                      <Ionicons name="chevron-down" size={16} color={theme.colors.truco.divider} />
                   </View>
                </View>
             </Animated.View>
          </View>
        </GestureDetector>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={[styles.gameTitle, { color: theme.colors.text.white }]}>TRUCO {translate(`truco.${gameMode}` as any).toUpperCase()}</Text>
          <View>
              <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
                <Ionicons name="settings-sharp" size={24} color={theme.colors.text.inverse} />
              </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scoreboardRow}>
          <TeamScoreArea team="them" score={scoreThem} name={nameThem} wins={matchWinsThem} color={COLOR_THEM} />
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.truco.divider }]} />
          <TeamScoreArea
            team="us"
            score={scoreUs}
            name={nameUs}
            wins={matchWinsUs}
            color={COLOR_US}
            scoreTargetProp={scoreTarget}
          />
        </View>

        <View style={[styles.footerHistory, { borderTopColor: theme.colors.truco.divider }]}>
           <MatchHistoryGraph 
              history={pointHistory} 
              colorThem={COLOR_THEM}
              colorUs={COLOR_US}
           />
        </View>

      </SafeAreaView>

      <TutorialOverlay
        visible={tutorialActive}
        spotlight={scoreTarget.layout}
        message={translate('truco.tutorial.score')}
        nextText={translate('common.got_it')}
        onNext={finishTutorial}
      />

      <TrucoSettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
        onReset={() => resetGame(true)} 
        gameMode={gameMode} 
        setGameMode={setGameMode}
        maxScore={maxScore}
        setMaxScore={setMaxScore}
      />
      
      <EditNameModal 
        visible={editNameVisible} 
        initialValue={editingTeam === 'us' ? nameUs : nameThem} 
        onClose={() => setEditNameVisible(false)} 
        onSave={(n) => { if (n.trim()) editingTeam === 'us' ? setNameUs(n) : setNameThem(n); }} 
      />

    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 50 },
  gameTitle: { fontFamily: 'Minecraft', fontSize: 20, letterSpacing: 1 },
  iconBtn: { padding: 8 },
  scoreboardRow: { flex: 1, flexDirection: 'row' },
  teamColumn: { flex: 1, height: '100%', position: 'relative' },
  colorBar: { position: 'absolute', top: 0, left: 10, right: 10, height: 4, borderRadius: 2, opacity: 0.9 },
  nameContainer: { alignItems: 'center', justifyContent: 'center', height: 60, marginTop: 10, zIndex: 20 },
  teamName: { fontFamily: 'Minecraft', fontSize: 18, opacity: 0.9, marginBottom: 4 },
  trophyContainer: { flexDirection: 'row', gap: 2, minHeight: 14 },
  gestureArea: { flex: 1, width: '100%' },
  scoreContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scoreNumber: { 
    fontFamily: 'Minecraft', 
    fontSize: 90, 
    includeFontPadding: false, 
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)', 
    textShadowOffset: {width: 4, height: 4}, 
    textShadowRadius: 1 
  },
  verticalDivider: { width: 1, height: '70%', alignSelf: 'center' },
  footerHistory: { height: 80, width: '100%', borderTopWidth: 1, justifyContent: 'center', paddingBottom: 5 },
  hintsOverlay: { position: 'absolute', right: 0, left: 0, top: 40, bottom: 40, justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' },
  hintBox: { alignItems: 'center', opacity: 0.3 },
  hintText: { fontSize: 10, fontFamily: 'Minecraft' }
});