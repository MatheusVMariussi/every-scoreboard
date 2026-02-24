import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import { TrucoHelpModal } from '../components/TrucoHelpModal';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { MatchHistoryGraph } from '../components/MatchHistoryGraph';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { useTutorialTarget } from '../hooks/useTutorialTarget';
import { useTrucoGame } from '../hooks/useTrucoGame';
import { ms, hp } from '../theme/responsive';

// --- COMPONENTE EXTRAÍDO ---
interface TeamScoreAreaProps {
  team: 'us' | 'them';
  score: number;
  name: string;
  wins: number;
  color: string;
  targetProp?: ReturnType<typeof useTutorialTarget>;
  basePoints: number;
  trucoPoints: number;
  onPointChange: (team: 'us' | 'them', points: number) => void;
  onEditName: (team: 'us' | 'them') => void;
}

const TeamScoreArea = ({
  team,
  score,
  name,
  wins,
  color,
  targetProp,
  basePoints,
  trucoPoints,
  onPointChange,
  onEditName,
}: TeamScoreAreaProps) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }] as any,
  }));

  const gesture = Gesture.Race(
    Gesture.Pan()
      .onUpdate((e) => {
        translateY.value = e.translationY * 0.1;
      })
      .onEnd((e) => {
        if (e.translationY < -40) {
          scheduleOnRN(onPointChange, team, trucoPoints);
        } else if (e.translationY > 40) {
          scheduleOnRN(onPointChange, team, -basePoints);
        }
        translateY.value = withSpring(0);
      }),
    Gesture.Tap()
      .onStart(() => {
        scale.value = withSpring(0.95);
      })
      .onEnd(() => {
        scale.value = withSpring(1);
        scheduleOnRN(onPointChange, team, basePoints);
      }),
  );

  return (
    <View style={styles.teamColumn}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />

      <View>
        <TouchableOpacity
          onPress={() => {
            onEditName(team);
          }}
          style={styles.nameContainer}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <Text style={[styles.teamName, { color: theme.colors.text.inverse }]}>
            {name} <Ionicons name="pencil" size={ms(12)} color={theme.colors.text.secondary} />
          </Text>
          <View style={styles.trophyContainer}>
            {Array.from({ length: wins }).map((_, i) => (
              <Ionicons
                key={`trophy-${team}-${String(i)}`}
                name="trophy"
                size={ms(12)}
                color={color}
              />
            ))}
          </View>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={gesture}>
        <View style={styles.gestureArea} collapsable={false}>
          <Animated.View style={[styles.scoreContainer, animatedStyle]}>
            <View ref={targetProp?.ref} collapsable={false}>
              <Text style={[styles.scoreNumber, { color: theme.colors.truco.scoreText }]}>
                {score.toString().padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.hintsOverlay}>
              <View style={styles.hintBox}>
                <Ionicons name="chevron-up" size={ms(16)} color={theme.colors.truco.divider} />
                <Text style={[styles.hintText, { color: theme.colors.text.white }]}>
                  +{trucoPoints}
                </Text>
              </View>
              <View style={styles.hintBox}>
                <Text style={[styles.hintText, { color: theme.colors.text.white }]}>
                  -{basePoints}
                </Text>
                <Ionicons name="chevron-down" size={ms(16)} color={theme.colors.truco.divider} />
              </View>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const TrucoScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const game = useTrucoGame();

  const COLOR_THEM = theme.colors.truco.teamThem;
  const COLOR_US = theme.colors.truco.teamUs;

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<'us' | 'them'>('us');

  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const scoreTarget = useTutorialTarget(tutorialActive && tutorialStep === 0);
  const settingsTarget = useTutorialTarget(tutorialActive && tutorialStep === 1);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const checkTutorial = async () => {
      const hasSeen = (await getData(STORAGE_KEYS.TUTORIAL_TRUCO)) as boolean | null;
      if (!hasSeen) {
        setTutorialActive(true);
        setTutorialStep(0);
      }
    };
    void checkTutorial();
  }, []);

  const handleNextTutorial = async () => {
    if (tutorialStep < 1) {
      setTutorialStep((prev) => prev + 1);
    } else {
      setTutorialActive(false);
      await saveData(STORAGE_KEYS.TUTORIAL_TRUCO, true);
    }
  };

  const getTutorialMessage = () => {
    switch (tutorialStep) {
      case 0:
        return translate('truco.tutorial.score');
      case 1:
        return translate('truco.tutorial.settings');
      default:
        return '';
    }
  };

  const getTutorialSpotlight = () => {
    switch (tutorialStep) {
      case 0:
        return scoreTarget.layout;
      case 1:
        return settingsTarget.layout;
      default:
        return null;
    }
  };

  const handleSaveName = (newName: string) => {
    if (newName.trim()) {
      if (editingTeam === 'us') {
        game.setNameUs(newName);
      } else {
        game.setNameThem(newName);
      }
    }
  };

  const handleEditName = (team: 'us' | 'them') => {
    setEditingTeam(team);
    setEditNameVisible(true);
  };

  const basePoints = game.getBasePoints();
  const trucoPoints = game.gameMode === 'paulista' ? 3 : 4;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={ms(24)} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={[styles.gameTitle, { color: theme.colors.text.white }]}>
            TRUCO {translate(`truco.${game.gameMode}`).toUpperCase()}
          </Text>
          <View ref={settingsTarget.ref} collapsable={false}>
            <TouchableOpacity
              onPress={() => {
                setSettingsVisible(true);
              }}
              style={styles.iconBtn}
            >
              <Ionicons name="settings-sharp" size={ms(24)} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scoreboardRow}>
          <TeamScoreArea
            team="them"
            score={game.scoreThem}
            name={game.nameThem}
            wins={game.matchWinsThem}
            color={COLOR_THEM}
            basePoints={basePoints}
            trucoPoints={trucoPoints}
            onPointChange={game.handlePointChange}
            onEditName={handleEditName}
          />
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.truco.divider }]} />
          <TeamScoreArea
            team="us"
            score={game.scoreUs}
            name={game.nameUs}
            wins={game.matchWinsUs}
            color={COLOR_US}
            targetProp={scoreTarget}
            basePoints={basePoints}
            trucoPoints={trucoPoints}
            onPointChange={game.handlePointChange}
            onEditName={handleEditName}
          />
        </View>

        <View style={[styles.footerHistory, { borderTopColor: theme.colors.truco.divider }]}>
          <MatchHistoryGraph
            history={game.pointHistory}
            colorThem={COLOR_THEM}
            colorUs={COLOR_US}
          />
        </View>
      </SafeAreaView>

      <TutorialOverlay
        visible={tutorialActive}
        spotlight={getTutorialSpotlight()}
        message={getTutorialMessage()}
        nextText={tutorialStep === 1 ? translate('common.got_it') : translate('common.next')}
        onNext={() => {
          void handleNextTutorial();
        }}
      />

      <TrucoSettingsModal
        visible={settingsVisible}
        onClose={() => {
          setSettingsVisible(false);
        }}
        onReset={() => {
          game.resetGame(true);
        }}
        onOpenHelp={() => {
          setSettingsVisible(false);
          setHelpVisible(true);
        }}
        gameMode={game.gameMode}
        setGameMode={game.setGameMode}
        maxScore={game.maxScore}
        setMaxScore={game.setMaxScore}
      />

      <TrucoHelpModal
        visible={helpVisible}
        onClose={() => {
          setHelpVisible(false);
          setSettingsVisible(true);
        }}
        gameMode={game.gameMode}
      />

      <EditNameModal
        visible={editNameVisible}
        initialValue={editingTeam === 'us' ? game.nameUs : game.nameThem}
        onClose={() => {
          setEditNameVisible(false);
        }}
        onSave={handleSaveName}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    height: ms(50),
  },
  gameTitle: { fontFamily: 'Minecraft', fontSize: ms(20), letterSpacing: ms(1) },
  iconBtn: { padding: ms(8) },
  scoreboardRow: { flex: 1, flexDirection: 'row' },
  teamColumn: { flex: 1, height: '100%', position: 'relative' },
  colorBar: {
    position: 'absolute',
    top: 0,
    left: ms(10),
    right: ms(10),
    height: ms(4),
    borderRadius: ms(2),
    opacity: 0.9,
  },
  nameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: ms(60),
    marginTop: ms(10),
    zIndex: 20,
  },
  teamName: { fontFamily: 'Minecraft', fontSize: ms(18), opacity: 0.9, marginBottom: ms(4) },
  trophyContainer: { flexDirection: 'row', gap: ms(2), minHeight: ms(14) },
  gestureArea: { flex: 1, width: '100%' },
  scoreContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scoreNumber: {
    fontFamily: 'Minecraft',
    fontSize: ms(90),
    includeFontPadding: false,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 1,
  },
  verticalDivider: { width: 1, height: '70%', alignSelf: 'center' },
  footerHistory: {
    height: hp('12%'),
    width: '100%',
    borderTopWidth: 1,
    justifyContent: 'center',
    paddingBottom: ms(5),
  },
  hintsOverlay: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: ms(40),
    bottom: ms(40),
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hintBox: { alignItems: 'center', opacity: 0.3 },
  hintText: { fontSize: ms(10), fontFamily: 'Minecraft' },
});
