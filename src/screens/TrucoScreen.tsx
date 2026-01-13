import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { TrucoSettingsModal } from '../components/TrucoSettingsModal';
import { GameButton } from '../components/GameButton';
import { EditNameModal } from '../components/EditNameModal';
import { MatchHistoryGraph, HistoryItem } from '../components/MatchHistoryGraph';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';

export const TrucoScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // --- ESTADOS DO JOGO ---
  const [scoreUs, setScoreUs] = useState(0);
  const [scoreThem, setScoreThem] = useState(0);
  const [handValue, setHandValue] = useState(1);
  const [gameMode, setGameMode] = useState<'paulista' | 'mineiro'>('paulista');
  const [matchWinsUs, setMatchWinsUs] = useState(0);
  const [matchWinsThem, setMatchWinsThem] = useState(0);
  const [pointHistory, setPointHistory] = useState<HistoryItem[]>([]);
  const [nameUs, setNameUs] = useState(translate('truco.us'));
  const [nameThem, setNameThem] = useState(translate('truco.them'));
  
  // --- CONTROLES DE UI ---
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<'us' | 'them'>('us');
  const [isLoaded, setIsLoaded] = useState(false);

  // --- PERSISTÊNCIA ---
  useEffect(() => {
    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.TRUCO_DATA);
      if (saved) {
        setScoreUs(saved.scoreUs);
        setScoreThem(saved.scoreThem);
        setHandValue(saved.handValue);
        setGameMode(saved.gameMode);
        setMatchWinsUs(saved.matchWinsUs);
        setMatchWinsThem(saved.matchWinsThem);
        setPointHistory(saved.pointHistory);
        setNameUs(saved.nameUs);
        setNameThem(saved.nameThem);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData(STORAGE_KEYS.TRUCO_DATA, { 
        scoreUs, scoreThem, handValue, gameMode, 
        matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem 
      });
    }
  }, [scoreUs, scoreThem, handValue, gameMode, matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem, isLoaded]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Reset por mudança de modo (Só dispara se não for o carregamento inicial)
  useEffect(() => {
    if (isLoaded && scoreUs === 0 && scoreThem === 0) {
      resetGame(true);
    }
  }, [gameMode]);

  const resetGame = (fullReset = false) => {
    setScoreUs(0);
    setScoreThem(0);
    setHandValue(gameMode === 'paulista' ? 1 : 2);
    setPointHistory([]);
    if (fullReset) {
      setMatchWinsUs(0);
      setMatchWinsThem(0);
    }
  };

  const resetHandStake = () => setHandValue(gameMode === 'paulista' ? 1 : 2);

  const changePoints = (team: 'us' | 'them', amount: number) => {
    const isAdding = amount > 0;
    const points = isAdding ? handValue : -1; 

    setPointHistory(prev => {
      const newHist = [...prev];
      if (isAdding) {
        newHist.push({ team, points: handValue });
      } else {
        let foundIndex = -1;
        for (let i = newHist.length - 1; i >= 0; i--) {
          if (newHist[i].team === team) { foundIndex = i; break; }
        }
        if (foundIndex !== -1) {
          const currentPoints = newHist[foundIndex].points;
          if (currentPoints > 1) {
            newHist[foundIndex] = { ...newHist[foundIndex], points: currentPoints - 1 };
          } else {
            newHist.splice(foundIndex, 1);
          }
        }
      }
      return newHist;
    });

    if (team === 'us') {
      const newScore = Math.max(0, scoreUs + points);
      if (newScore >= 12 && isAdding) {
        handleVictory(nameUs, 'us');
        setScoreUs(12);
      } else {
        setScoreUs(newScore);
      }
    } else {
      const newScore = Math.max(0, scoreThem + points);
      if (newScore >= 12 && isAdding) {
        handleVictory(nameThem, 'them');
        setScoreThem(12);
      } else {
        setScoreThem(newScore);
      }
    }
    if (isAdding) resetHandStake();
  };

  const handleVictory = (winnerName: string, winnerTeam: 'us' | 'them') => {
    if (winnerTeam === 'us') setMatchWinsUs(prev => Math.min(prev + 1, 5));
    else setMatchWinsThem(prev => Math.min(prev + 1, 5));

    Alert.alert(
        translate('common.game_over'),
        translate('common.winner_text', { team: winnerName }),
        [
            { text: translate('common.cancel'), style: "cancel" },
            { text: translate('common.new_match'), onPress: () => resetGame(false) }
        ]
    );
  };

  const renderTrophies = (count: number) => {
    if (count === 0) return null;
    return (
      <View style={styles.trophyContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <Ionicons key={i} name="trophy" size={16} color={theme.colors.truco.trophy} />
        ))}
      </View>
    );
  };

  const increaseStakes = () => {
    const sequence = gameMode === 'paulista' ? [1, 3, 6, 9, 12] : [2, 4, 6, 8, 10, 12];
    const currentIndex = sequence.indexOf(handValue);
    if (currentIndex < sequence.length - 1) setHandValue(sequence[currentIndex + 1]);
  };

  const getButtonLabel = () => {
    if (handValue >= 12) return translate('truco.value_12');
    if (gameMode === 'paulista') {
        if (handValue === 1) return translate('truco.button_truco');
        if (handValue === 3) return translate('truco.button_six');
        if (handValue === 6) return translate('truco.button_nine');
        if (handValue === 9) return translate('truco.button_twelve');
    } else {
        if (handValue === 2) return translate('truco.button_truco');
        if (handValue === 4) return translate('truco.button_six');
        if (handValue === 6) return translate('truco.button_eight');
        if (handValue === 8) return translate('truco.button_ten');
        if (handValue === 10) return translate('truco.button_twelve');
    }
    return translate('truco.button_max');
  };

  const openEditName = (team: 'us' | 'them') => {
    setEditingTeam(team);
    setEditNameVisible(true);
  };

  const isHandRaised = handValue > (gameMode === 'paulista' ? 1 : 2);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.container}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={28} color={theme.colors.text.inverse} />
            </TouchableOpacity>
            
            <View style={styles.stakeContainer}>
                <View style={[styles.handIndicator, { backgroundColor: theme.colors.truco.handIndicatorBackground }]}>
                    <Text style={styles.handLabel}>{translate('truco.value')}</Text>
                    <Text style={[styles.handValue, { color: theme.colors.truco.scoreText }]}>{handValue}</Text>
                </View>
                {isHandRaised && (
                    <TouchableOpacity onPress={resetHandStake} style={styles.resetHandBtn}>
                        <Ionicons name="refresh-circle" size={32} color={theme.colors.status.error} />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
                <Ionicons name="settings-sharp" size={28} color={theme.colors.text.inverse} />
            </TouchableOpacity>
        </View>

        <View style={styles.scoreboard}>
            <View style={styles.teamContainer}>
                <TouchableOpacity onPress={() => openEditName('them')} style={styles.teamNameWrapper}>
                    <View style={styles.rowCentered}>
                        <Text style={[styles.teamName, { color: theme.colors.text.inverse }]}>
                            {nameThem} <Ionicons name="pencil" size={12} color={theme.colors.text.secondary} />
                        </Text>
                        {renderTrophies(matchWinsThem)}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.scoreBlock, { backgroundColor: theme.colors.truco.cardBackground }]} 
                    activeOpacity={0.7}
                    onPress={() => changePoints('them', 1)}
                >
                    <Text style={[styles.scoreNumber, { color: theme.colors.truco.scoreText }]}>
                        {scoreThem.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity 
                        style={[styles.subtractBtn, { backgroundColor: theme.colors.truco.subtractButtonBackground }]} 
                        onPress={(e) => { e.stopPropagation(); changePoints('them', -1); }}
                    >
                        <Ionicons name="remove" size={18} color={theme.colors.text.inverse} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>

            <MatchHistoryGraph history={pointHistory} />

            <View style={styles.teamContainer}>
                <TouchableOpacity onPress={() => openEditName('us')} style={styles.teamNameWrapper}>
                    <View style={styles.rowCentered}>
                         <Text style={[styles.teamName, { color: theme.colors.text.inverse }]}>
                            {nameUs} <Ionicons name="pencil" size={12} color={theme.colors.text.secondary} />
                        </Text>
                        {renderTrophies(matchWinsUs)}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.scoreBlock, { backgroundColor: theme.colors.truco.cardBackground }]} 
                    activeOpacity={0.7}
                    onPress={() => changePoints('us', 1)}
                >
                    <Text style={[styles.scoreNumber, { color: theme.colors.truco.scoreText }]}>
                        {scoreUs.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity 
                        style={[styles.subtractBtn, { backgroundColor: theme.colors.truco.subtractButtonBackground }]} 
                        onPress={(e) => { e.stopPropagation(); changePoints('us', -1); }}
                    >
                        <Ionicons name="remove" size={18} color={theme.colors.text.inverse} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.footer}>
            <View style={styles.fullWidthHeight}>
                 <GameButton 
                    title={getButtonLabel() + "!"} 
                    onPress={increaseStakes}
                    style={{ 
                        backgroundColor: isHandRaised ? theme.colors.truco.buttonTruco : theme.colors.home.buttonBackground,
                        borderColor: isHandRaised ? '#8a232b' : theme.colors.home.buttonBorder 
                    }}
                 />
            </View>
        </View>

      </SafeAreaView>

      <TrucoSettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
        onReset={() => resetGame(true)}
        gameMode={gameMode} 
        setGameMode={setGameMode} 
      />
      <EditNameModal 
        visible={editNameVisible} initialValue={editingTeam === 'us' ? nameUs : nameThem} 
        onClose={() => setEditNameVisible(false)} 
        onSave={(newName) => { if (newName.trim()) { editingTeam === 'us' ? setNameUs(newName) : setNameThem(newName); } }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4, height: 50 },
  iconBtn: { padding: 8 },
  stakeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handIndicator: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resetHandBtn: { padding: 4 },
  handLabel: { color: '#CCC', fontSize: 10, fontFamily: 'Minecraft', marginBottom: 2 },
  handValue: { fontSize: 24, fontFamily: 'Minecraft', lineHeight: 28 },
  scoreboard: { flex: 1, justifyContent: 'space-evenly' },
  teamContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  teamNameWrapper: { width: '100%', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 4 },
  teamName: { fontFamily: 'Minecraft', fontSize: 16, opacity: 0.9, padding: 4 },
  scoreBlock: { width: '100%', height: 135, justifyContent: 'center', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  scoreNumber: { fontFamily: 'Minecraft', fontSize: 100, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0 },
  subtractBtn: { position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.5)' },
  footer: { marginTop: 4, height: 90, width: '100%', justifyContent: 'flex-end', paddingBottom: 4 },
  trophyContainer: { flexDirection: 'row', gap: 2 },
  rowCentered: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fullWidthHeight: { width: '100%', height: '100%' }
});