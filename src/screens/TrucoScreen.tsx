import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, runOnJS } from 'react-native-reanimated';

import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { TrucoSettingsModal } from '../components/TrucoSettingsModal';
import { EditNameModal } from '../components/EditNameModal';
import { MatchHistoryGraph, HistoryItem } from '../components/MatchHistoryGraph';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export const TrucoScreen = () => {
  // Trava a orientação em Retrato
  useScreenOrientation('PORTRAIT');
  
  const { theme } = useTheme();
  const navigation = useNavigation();

  // CORES DOS TIMES
  const COLOR_THEM = '#FF453A';
  const COLOR_US = '#32D74B';

  // --- ESTADOS ---
  const [scoreUs, setScoreUs] = useState(0);
  const [scoreThem, setScoreThem] = useState(0);
  
  // Configurações do Jogo
  const [gameMode, setGameMode] = useState<'paulista' | 'mineiro'>('paulista');
  const [maxScore, setMaxScore] = useState(12); // Padrão 12, pode mudar para 24
  
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

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  // --- PERSISTÊNCIA ---
  useEffect(() => {
    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.TRUCO_DATA);
      if (saved) {
        setScoreUs(saved.scoreUs); setScoreThem(saved.scoreThem);
        setGameMode(saved.gameMode);
        // Recupera maxScore se existir, senão assume 12 (retrocompatibilidade)
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
        scoreUs, scoreThem, gameMode, maxScore, // Salva maxScore
        matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem 
      });
    }
  }, [scoreUs, scoreThem, gameMode, maxScore, matchWinsUs, matchWinsThem, pointHistory, nameUs, nameThem, isLoaded]);

  // Reset inteligente: Se mudar modo ou pontuação máxima, reseta a rodada
  useEffect(() => { 
    if (isLoaded && scoreUs === 0 && scoreThem === 0) resetGame(true); 
  }, [gameMode, maxScore]);

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
        // Adicionando ponto
        newHist.push({ team, points: pointsToAdd });
      } else {
        // Removendo ponto (Undo inteligente)
        let foundIndex = -1;
        // Procura o último ponto desse time
        for (let i = newHist.length - 1; i >= 0; i--) { 
            if (newHist[i].team === team) { foundIndex = i; break; } 
        }
        
        if (foundIndex !== -1) {
          const currentPoints = newHist[foundIndex].points;
          const base = getBasePoints();
          
          // Se o ponto registrado for maior que a base (ex: foi um Truco), reduzimos o valor dele
          // Se for igual a base, removemos o registro do gráfico
          if (currentPoints > base && Math.abs(pointsToAdd) === base) {
             newHist[foundIndex] = { ...newHist[foundIndex], points: currentPoints - base };
          } else {
             newHist.splice(foundIndex, 1);
          }
        }
      }
      return newHist;
    });

    // Atualiza placar e checa vitória
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
  const TeamScoreArea = ({ team, score, name, wins, color }: any) => {
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
             runOnJS(handlePointChange)(team, trucoValue); // Swipe Up: Truco
          } else if (e.translationY > 40) {
             runOnJS(handlePointChange)(team, -baseValue); // Swipe Down: Remove Base
          }
          translateY.value = withSpring(0);
        }),
      Gesture.Tap()
        .onStart(() => { scale.value = withSpring(0.95); })
        .onEnd(() => { 
            scale.value = withSpring(1); 
            runOnJS(handlePointChange)(team, baseValue); // Tap: Adiciona Base
        })
    );

    return (
      <View style={styles.teamColumn}>
        {/* Barra Colorida no topo */}
        <View style={[styles.colorBar, { backgroundColor: color }]} />

        {/* NOME (Clicável separadamente para não conflitar com gestos) */}
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

        {/* ÁREA DE GESTOS (Ocupa o resto da coluna) */}
        <GestureDetector gesture={gesture}>
          <View style={styles.gestureArea}>
             <Animated.View style={[styles.scoreContainer, animatedStyle]}>
                <Text style={[styles.scoreNumber, { color: theme.colors.truco.scoreText }]}>
                  {score.toString().padStart(2, '0')}
                </Text>

                {/* Dicas visuais nas extremidades */}
                <View style={styles.hintsOverlay}>
                   <View style={styles.hintBox}>
                      <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.2)" />
                      <Text style={styles.hintText}>+{trucoValue}</Text>
                   </View>
                   <View style={styles.hintBox}>
                      <Text style={styles.hintText}>-{baseValue}</Text>
                      <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.2)" />
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
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.gameTitle}>TRUCO {gameMode.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
            <Ionicons name="settings-sharp" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>

        {/* ÁREA CENTRAL - LADO A LADO */}
        <View style={styles.scoreboardRow}>
          {/* ELES (Esquerda / Vermelho) */}
          <TeamScoreArea team="them" score={scoreThem} name={nameThem} wins={matchWinsThem} color={COLOR_THEM} />
          
          {/* Divisor Vertical */}
          <View style={styles.verticalDivider} />

          {/* NÓS (Direita / Verde) */}
          <TeamScoreArea team="us" score={scoreUs} name={nameUs} wins={matchWinsUs} color={COLOR_US} />
        </View>

        {/* FOOTER - HISTÓRICO */}
        <View style={styles.footerHistory}>
           <MatchHistoryGraph 
              history={pointHistory} 
              colorThem={COLOR_THEM}
              colorUs={COLOR_US}
           />
        </View>

      </SafeAreaView>

      {/* MODAIS */}
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
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 50 },
  gameTitle: { fontFamily: 'Minecraft', fontSize: 20, color: '#FFF', letterSpacing: 1 },
  iconBtn: { padding: 8 },
  
  // Layout Principal
  scoreboardRow: { flex: 1, flexDirection: 'row' },
  teamColumn: { flex: 1, height: '100%', position: 'relative' },
  colorBar: { position: 'absolute', top: 0, left: 10, right: 10, height: 4, borderRadius: 2, opacity: 0.9 },
  
  // Componente de Nome
  nameContainer: { alignItems: 'center', justifyContent: 'center', height: 60, marginTop: 10, zIndex: 20 },
  teamName: { fontFamily: 'Minecraft', fontSize: 18, opacity: 0.9, marginBottom: 4 },
  trophyContainer: { flexDirection: 'row', gap: 2, minHeight: 14 },

  // Componente de Gesto/Placar
  gestureArea: { flex: 1, width: '100%' },
  scoreContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scoreNumber: { 
    fontFamily: 'Minecraft', 
    fontSize: 90, 
    includeFontPadding: false, 
    textAlign: 'center',
    width: '100%', 
    textShadowColor: 'rgba(0,0,0,0.3)', 
    textShadowOffset: {width: 4, height: 4}, 
    textShadowRadius: 1 
  },
  
  // Elementos Gráficos
  verticalDivider: { width: 1, height: '70%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },
  footerHistory: { height: 80, width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingBottom: 5 },
  
  // Dicas de Gesto
  hintsOverlay: { position: 'absolute', right: 0, left: 0, top: 40, bottom: 40, justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' },
  hintBox: { alignItems: 'center', opacity: 0.3 },
  hintText: { fontSize: 10, fontFamily: 'Minecraft', color: '#FFF' }
});