import React, { useState, useLayoutEffect, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { GameButton } from '../components/GameButton';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { EditNameModal } from '../components/EditNameModal';
import { FodinhaSettingsModal } from '../components/FodinhaSettingsModal';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useTutorialTarget } from '../hooks/useTutorialTarget';

interface Player {
  id: string;
  name: string;
  lives: number;
  history: number[]; 
  currentBid: number; 
  currentWon: number; 
}

export const FodinhaScreen = () => {
  useScreenOrientation('LANDSCAPE');
  
  const { theme } = useTheme();
  const navigation = useNavigation();
  const horizontalScrollRef = useRef<ScrollView>(null);

  // --- ESTADOS ---
  const [initialLives, setInitialLives] = useState(10);
  const [penaltyMode, setPenaltyMode] = useState<'fixed' | 'difference'>('fixed');
  const [cardsInRound, setCardsInRound] = useState(1); 
  const [roundPhase, setRoundPhase] = useState<'betting' | 'results'>('betting'); 

  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: translate('common.player') + ' 1', lives: 10, history: [], currentBid: 0, currentWon: 0 },
    { id: '2', name: translate('common.player') + ' 2', lives: 10, history: [], currentBid: 0, currentWon: 0 },
    { id: '3', name: translate('common.player') + ' 3', lives: 10, history: [], currentBid: 0, currentWon: 0 },
  ]);

  // MODAIS
  const [showEditName, setShowEditName] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // MODAL DE EDIÇÃO DE HISTÓRICO
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);

  // Tutorial State
  const [tutorialActive, setTutorialActive] = useState(false);

  // Custom Hooks for Tutorial
  const actionsTarget = useTutorialTarget(tutorialActive);

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  useEffect(() => {
    const checkTutorial = async () => {
      const hasSeen = await getData(STORAGE_KEYS.TUTORIAL_FODINHA);
      if (!hasSeen) {
        setTutorialActive(true);
      }
    };
    checkTutorial();

    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.FODINHA_DATA);
      if (saved) {
        setPlayers(saved.players);
        setInitialLives(saved.initialLives);
        setPenaltyMode(saved.penaltyMode || 'fixed');
        setCardsInRound(saved.cardsInRound || 1);
        setRoundPhase(saved.roundPhase || 'betting');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    saveData(STORAGE_KEYS.FODINHA_DATA, { players, initialLives, penaltyMode, cardsInRound, roundPhase });
  }, [players, initialLives, penaltyMode, cardsInRound, roundPhase]);

  // --- TUTORIAL LOGIC ---
  const finishTutorial = async () => {
      setTutorialActive(false);
      await saveData(STORAGE_KEYS.TUTORIAL_FODINHA, true);
  };

  // --- LÓGICA DE JOGO ---
  
  const totalBids = useMemo(() => players.reduce((acc, p) => acc + p.currentBid, 0), [players]);
  const totalWon = useMemo(() => players.reduce((acc, p) => acc + p.currentWon, 0), [players]);

  const handlePhaseChange = () => {
    if (roundPhase === 'betting') {
      if (totalBids === cardsInRound) {
        Alert.alert(
            translate('fodinha.invalid_bets_title'),
            translate('fodinha.invalid_bets_message', { total: totalBids, cards: cardsInRound })
        );
        return;
      }
      setRoundPhase('results');
    } else {
      if (totalWon !== cardsInRound) {
        Alert.alert(
            translate('fodinha.wrong_count_title'),
            translate('fodinha.wrong_count_message', { total: totalWon, cards: cardsInRound })
        );
        return;
      }
      finishRound();
    }
  };

  const finishRound = () => {
    setPlayers(prev => prev.map(p => {
      if (p.lives <= 0) return p; 

      const diff = Math.abs(p.currentBid - p.currentWon);
      let damage = 0;
      if (diff > 0) damage = penaltyMode === 'fixed' ? 1 : diff; 

      return {
        ...p,
        lives: Math.max(0, p.lives - damage),
        history: [...p.history, damage],
        currentBid: 0,
        currentWon: 0
      };
    }));

    setCardsInRound(prev => prev + 1); 
    setRoundPhase('betting');
    setTimeout(() => horizontalScrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const adjustValue = (playerId: string, delta: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      
      if (roundPhase === 'betting') {
        const newBid = Math.max(0, Math.min(cardsInRound, p.currentBid + delta));
        return { ...p, currentBid: newBid };
      } else {
        const newWon = Math.max(0, Math.min(cardsInRound, p.currentWon + delta));
        return { ...p, currentWon: newWon };
      }
    }));
  };

  // --- NOVA FUNÇÃO: AJUSTAR DANO NO HISTÓRICO ---
  const adjustHistoryDamage = (playerId: string, delta: number) => {
    if (editingRoundIdx === null) return;

    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;

      const newHistory = [...p.history];
      // Garante que o dano não seja negativo
      const currentDamage = newHistory[editingRoundIdx] || 0;
      const newDamage = Math.max(0, currentDamage + delta);
      
      newHistory[editingRoundIdx] = newDamage;

      // RECALCULA AS VIDAS TOTAIS
      const totalDamage = newHistory.reduce((a, b) => a + b, 0);
      const newLives = initialLives - totalDamage;

      return {
        ...p,
        history: newHistory,
        lives: newLives // Atualiza a vida imediatamente
      };
    }));
  };

  // --- NOVA FUNÇÃO: DELETAR RODADA ---
  const deleteRound = () => {
    if (editingRoundIdx === null) return;

    Alert.alert(translate('cacheta.delete_round'), translate('cacheta.confirm_delete_round'), [
        { text: translate('common.cancel'), style: 'cancel' },
        { text: translate('common.confirm'), style: 'destructive', onPress: () => {
            setPlayers(prev => prev.map(p => {
                const newHistory = [...p.history];
                newHistory.splice(editingRoundIdx, 1);
                
                // Recalcula vidas após remover rodada
                const totalDamage = newHistory.reduce((a, b) => a + b, 0);
                const newLives = initialLives - totalDamage;

                return { ...p, history: newHistory, lives: newLives };
            }));
            
            setShowEditHistory(false);
        }}
    ]);
  };

  const handleReset = () => {
    setPlayers(prev => prev.map(p => ({ 
      ...p, lives: initialLives, history: [], currentBid: 0, currentWon: 0 
    })));
    setCardsInRound(1);
    setRoundPhase('betting');

    if (tutorialActive) finishTutorial();
  };

  const handleAddPlayer = () => {
    setPlayers(prev => {
        const currentRounds = prev.length > 0 ? prev[0].history.length : 0;
        const newPlayer: Player = { 
            id: Date.now().toString(), 
            name: `${translate('common.player')} ${prev.length + 1}`,
            lives: initialLives, 
            history: new Array(currentRounds).fill(0), 
            currentBid: 0, 
            currentWon: 0 
        };
        return [...prev, newPlayer];
    });
  };

  const handleDeletePlayer = () => {
    if (!editingPlayerId) return;
    setPlayers(prev => prev.filter(p => p.id !== editingPlayerId));
    setShowEditName(false);
  };

  const getEditingPlayerName = () => players.find(p => p.id === editingPlayerId)?.name || '';
  const getProjectedDamage = (p: Player) => {
    const diff = Math.abs(p.currentBid - p.currentWon);
    if (diff === 0) return 0;
    return penaltyMode === 'fixed' ? 1 : diff;
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        
        {/* HEADER */}
        <View style={styles.header}>
          
          {/* LADO ESQUERDO: BOTÃO VOLTAR (Restaurado) */}
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>

          {/* CENTRO: TÍTULO */}
          <Text style={styles.headerTitle}>{translate('fodinha.title')}</Text>

          {/* LADO DIREITO: CONTROLES DE CARTAS + SETTINGS */}
          <View style={[styles.headerSide, { justifyContent: 'flex-end', gap: 10 }]}>

            {(() => {
                const isCardsLocked = roundPhase !== 'betting';
                
                return (
                    <View style={[styles.cardsControlContainer, { backgroundColor: theme.colors.fodinha.cardBackground, borderColor: theme.colors.fodinha.divider }, isCardsLocked && { opacity: 0.5, backgroundColor: theme.colors.background.overlay }]}>
                        <TouchableOpacity 
                            onPress={() => setCardsInRound(prev => Math.max(1, prev - 1))} 
                            style={styles.cardsStepBtn}
                            hitSlop={{top: 10, bottom: 10, left: 5, right: 5}}
                            disabled={isCardsLocked}
                        >
                            <Ionicons name="remove" size={14} color={isCardsLocked ? theme.colors.text.secondary : theme.colors.text.white} />
                        </TouchableOpacity>

                        <View style={styles.cardsCenter}>
                            <Ionicons name="documents-outline" size={12} color={theme.colors.text.white} style={{ marginRight: 4 }} />
                            <Text style={styles.badgeText}>{cardsInRound} {translate('fodinha.cards')}</Text>
                        </View>

                        <TouchableOpacity 
                            onPress={() => setCardsInRound(prev => prev + 1)} 
                            style={styles.cardsStepBtn}
                            hitSlop={{top: 10, bottom: 10, left: 5, right: 5}}
                            disabled={isCardsLocked}
                        >
                            <Ionicons name="add" size={14} color={isCardsLocked ? theme.colors.text.secondary : theme.colors.text.white} />
                        </TouchableOpacity>
                    </View>
                );
            })()}

            <View>
                <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
                    <Ionicons name="settings-sharp" size={24} color={theme.colors.text.white} />
                </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <ScrollView ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
            
            {/* COLUNA NOMES */}
            <View style={styles.namesColumn}>
              <View style={styles.cellHeader}><Text style={styles.headerText}>{translate('common.player').toUpperCase()}</Text></View>
              {players.map((p, index) => (
                <View key={p.id}>
                    <TouchableOpacity
                        style={[styles.playerCell, { backgroundColor: theme.colors.truco.cardBackground }]}
                        onPress={() => { setEditingPlayerId(p.id); setShowEditName(true); }}
                    >
                    <Text style={[styles.playerName, { color: theme.colors.text.white }, p.lives <= 0 && styles.outText]} numberOfLines={1}>{p.name}</Text>
                    <View style={styles.livesContainer}>
                        <Ionicons name="heart" size={12} color={theme.colors.status.error} />
                        <Text style={[styles.playerPoints, { color: theme.colors.text.white }]}>{p.lives}</Text>
                    </View>
                    </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}>
                <Ionicons name="add-circle" size={26} color={theme.colors.neon.primary} />
              </TouchableOpacity>
            </View>

            {/* HISTÓRICO */}
            <View style={{ flexDirection: 'row' }}>
              {players.length > 0 && players[0].history.map((_, rIdx) => (
                <View key={rIdx}>
                    <TouchableOpacity
                        style={styles.historyColumn}
                        onPress={() => { setEditingRoundIdx(rIdx); setShowEditHistory(true); }}
                    >
                    <View style={styles.cellHeader}><Text style={styles.headerText}>{rIdx + 1}</Text></View>
                    {players.map(p => {
                        const damage = p.history[rIdx];
                        const isSafe = damage === 0;
                        return (
                            <View key={p.id} style={[styles.historyCell, { backgroundColor: theme.colors.fodinha.cardBackground }]}>
                            {isSafe ? (
                                <View style={[styles.safeDot, { backgroundColor: theme.colors.fodinha.safeDot }]} />
                            ) : (
                                <Text style={[styles.damageText, { color: theme.colors.fodinha.damageText }]}>-{damage}</Text>
                            )}
                            </View>
                        );
                    })}
                    </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* COLUNA ATUAL */}
            <View style={[styles.activeColumn, { backgroundColor: theme.colors.truco.cardBackground, borderColor: theme.colors.fodinha.divider }]}>
              <View style={[styles.cellHeaderActive, { backgroundColor: roundPhase === 'betting' ? theme.colors.status.warning : theme.colors.neon.primary }]}>
                <Text style={[styles.headerText, { color: theme.colors.text.black, fontWeight: 'bold' }]}>
                    {roundPhase === 'betting' ? translate('fodinha.bets') : translate('fodinha.results')}
                </Text>
              </View>

              {players.map((p, index) => {
                  if (p.lives <= 0) return <View key={p.id} style={styles.activeCell}><Text style={[styles.outLabel, { color: theme.colors.fodinha.eliminated }]}>{translate('fodinha.eliminated')}</Text></View>;
                  const projectedDamage = getProjectedDamage(p);

                  return (
                    <View key={p.id} style={[styles.activeCell, { borderBottomColor: theme.colors.fodinha.divider }]} ref={index === 0 ? actionsTarget.ref : undefined} collapsable={false}>
                        <View style={[styles.stepperContainer, { backgroundColor: theme.colors.background.overlay }]}>
                            <TouchableOpacity onPress={() => adjustValue(p.id, -1)} style={[styles.stepBtn, { backgroundColor: theme.colors.fodinha.divider }]}>
                                <Ionicons name="remove" size={16} color={theme.colors.text.white} />
                            </TouchableOpacity>
                            <Text style={[styles.mainValue, { color: theme.colors.text.white }]}>
                                {roundPhase === 'betting' ? p.currentBid : p.currentWon}
                            </Text>
                            <TouchableOpacity onPress={() => adjustValue(p.id, 1)} style={[styles.stepBtn, { backgroundColor: theme.colors.fodinha.divider }]}>
                                <Ionicons name="add" size={16} color={theme.colors.text.white} />
                            </TouchableOpacity>
                        </View>
                        {roundPhase === 'results' && (
                            <View style={styles.feedbackContainer}>
                                <Text style={{ fontSize: 8, color: theme.colors.text.secondary, fontFamily: 'Minecraft' }}>{translate('fodinha.bet')}: {p.currentBid}</Text>
                                {projectedDamage > 0 ? (
                                    <Text style={{ fontSize: 10, color: theme.colors.fodinha.damageText, fontFamily: 'Minecraft' }}>-{projectedDamage}</Text>
                                ) : (
                                    <Ionicons name="checkmark-circle" size={12} color={theme.colors.status.success} />
                                )}
                            </View>
                        )}
                    </View>
                  );
              })}
              <View style={[styles.columnFooter, { backgroundColor: theme.colors.background.overlay }]}>
                  <Text style={[styles.footerInfo, { 
                      color: (roundPhase === 'betting' && totalBids === cardsInRound) || (roundPhase === 'results' && totalWon !== cardsInRound)
                      ? theme.colors.status.error : theme.colors.text.white
                  }]}>
                      {translate('fodinha.total')}: {roundPhase === 'betting' ? totalBids : totalWon}/{cardsInRound}
                  </Text>
              </View>
            </View>
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          <View style={{ width: 250, height: 50 }}>
            <GameButton 
                title={roundPhase === 'betting' ? translate('fodinha.confirm_bets') : translate('fodinha.finish_round')}
                onPress={handlePhaseChange} 
                variant={roundPhase === 'betting' ? 'secondary' : 'primary'}
            />
          </View>
        </View>

      </SafeAreaView>

      {/* OVERLAY: EDITAR HISTÓRICO (NOVO) */}
      {showEditHistory && editingRoundIdx !== null && (
        <View style={[styles.absoluteOverlay, { backgroundColor: theme.colors.background.overlay }]}>

            <TouchableOpacity 
                style={StyleSheet.absoluteFill} 
                activeOpacity={1} 
                onPress={() => setShowEditHistory(false)}
            />

            <View style={[styles.overlayContent, { width: '50%', maxHeight: '85%', backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.text.secondary }]}>
                
                <View style={styles.modalHeader}>
                    <Text style={[styles.overlayTitle, { color: theme.colors.text.primary }]}>
                        {translate('common.edit_round', { index: editingRoundIdx + 1 })}
                    </Text>
                    <TouchableOpacity onPress={() => setShowEditHistory(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                        <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', fontSize: 10, marginBottom: 10, fontFamily: 'Minecraft' }}>
                    {translate('fodinha.edit_round_instruction')}
                </Text>

                {/* SCROLL AREA LIBERADA */}
                <View style={{ flexShrink: 1 }}>
                    <ScrollView 
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ paddingBottom: 20 }} // Espaço extra no final
                        indicatorStyle="white"
                    >
                        {players.map(p => {
                            const damage = p.history[editingRoundIdx] || 0;
                            return (
                                <View key={p.id} style={[styles.editHistoryRow, { borderBottomColor: theme.colors.fodinha.divider }]}>
                                    <Text style={{ color: theme.colors.text.primary, fontFamily: 'Minecraft', fontSize: 12, flex: 1 }}>{p.name}</Text>
                                    
                                    <View style={[styles.stepperContainer, { backgroundColor: theme.colors.background.overlay }]}>
                                        <TouchableOpacity onPress={() => adjustHistoryDamage(p.id, -1)} style={[styles.stepBtn, { backgroundColor: theme.colors.fodinha.divider }]} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                                            <Ionicons name="remove" size={16} color={theme.colors.text.white} />
                                        </TouchableOpacity>
                                        
                                        <Text style={[styles.mainValue, { color: damage > 0 ? theme.colors.fodinha.damageText : theme.colors.status.success }]}>
                                            {damage > 0 ? `-${damage}` : 'OK'}
                                        </Text>

                                        <TouchableOpacity onPress={() => adjustHistoryDamage(p.id, 1)} style={[styles.stepBtn, { backgroundColor: theme.colors.fodinha.divider }]} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                                            <Ionicons name="add" size={16} color={theme.colors.text.white} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                <View style={[styles.modalFooterRow, { borderTopColor: theme.colors.fodinha.divider }]}>
                        <TouchableOpacity onPress={deleteRound} style={{ padding: 10 }}>
                        <Text style={{ color: theme.colors.status.error, fontFamily: 'Minecraft', fontSize: 12, textDecorationLine: 'underline' }}>{translate('cacheta.delete_round')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowEditHistory(false)} style={[styles.saveBtnSmall, { backgroundColor: theme.colors.brand.primary }]}>
                        <Text style={{ color: theme.colors.text.white, fontFamily: 'Minecraft' }}>{translate('common.save')}</Text>
                        </TouchableOpacity>
                </View>

            </View>
        </View>
      )}

      <FodinhaSettingsModal 
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onReset={handleReset}
        initialLives={initialLives}
        setInitialLives={setInitialLives}
        penaltyMode={penaltyMode}
        setPenaltyMode={setPenaltyMode}
      />

      <EditNameModal 
        visible={showEditName} 
        initialValue={getEditingPlayerName()} 
        onClose={() => setShowEditName(false)} 
        onSave={(n) => { if(n.trim() && editingPlayerId) setPlayers(prev => prev.map(p => p.id === editingPlayerId ? { ...p, name: n } : p)); }}
        onDelete={handleDeletePlayer}
      />

      <TutorialOverlay
        visible={tutorialActive}
        spotlight={actionsTarget.layout}
        message={translate('fodinha.tutorial.actions')}
        onNext={finishTutorial}
        nextText={translate('common.got_it')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 50 },
  headerSide: { flex: 1, flexDirection: 'row' },
  headerTitle: { fontFamily: 'Minecraft', color: '#FFF', fontSize: 16, textAlign: 'center', flex: 2 },
  iconBtn: { padding: 5 },
  cardsControlContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 10, 
    borderWidth: 1, 
    height: 30
  },
  cardsStepBtn: { 
    height: '100%', 
    paddingHorizontal: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cardsCenter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 4 
  },
  badgeText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 10 },
  tableScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  namesColumn: { width: 140 },
  cellHeader: { height: 30, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 10, fontFamily: 'Minecraft', color: '#888' },
  playerCell: { height: 60, paddingHorizontal: 10, justifyContent: 'center', marginBottom: 4, borderRadius: 10 },
  playerName: { fontFamily: 'Minecraft', fontSize: 11, marginBottom: 4 },
  livesContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playerPoints: { fontSize: 14, fontFamily: 'Minecraft' },
  outText: { textDecorationLine: 'line-through', opacity: 0.5 },
  addBtn: { height: 40, justifyContent: 'center', alignItems: 'center' },
  historyColumn: { width: 40, alignItems: 'center' },
  historyCell: { width: 34, height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderRadius: 6 },
  safeDot: { width: 8, height: 8, borderRadius: 4 },
  damageText: { fontFamily: 'Minecraft', fontSize: 12 },
  activeColumn: { marginLeft: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 1, alignSelf: 'flex-start', minWidth: 160 },
  cellHeaderActive: { height: 30, justifyContent: 'center', alignItems: 'center' },
  activeCell: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 4, borderBottomWidth: 1 },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, padding: 4, minWidth: 120, justifyContent: 'center' },
  stepBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  mainValue: { fontFamily: 'Minecraft', fontSize: 18, width: 50, textAlign: 'center' },
  feedbackContainer: { alignItems: 'flex-end', marginLeft: 10 },
  outLabel: { fontFamily: 'Minecraft', fontSize: 10 },
  columnFooter: { padding: 5, alignItems: 'center' },
  footerInfo: { fontFamily: 'Minecraft', fontSize: 10 },
  footer: { height: 60, justifyContent: 'center', alignItems: 'center' },
  
  // Overlay Styles
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  overlayContent: { padding: 20, borderRadius: 20, borderWidth: 1 },
  overlayTitle: { fontFamily: 'Minecraft', fontSize: 14, textAlign: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  editHistoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1 },
  modalFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1 },
  saveBtnSmall: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
});
