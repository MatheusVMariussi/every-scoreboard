import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, TouchableWithoutFeedback
} from 'react-native';
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
import { CachetaSettingsModal } from '../components/CachetaSettingsModal';
import { CachetaHelpModal } from '../components/CachetaHelpModal';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useTutorialTarget } from '../hooks/useTutorialTarget';
import { useCachetaGame } from '../hooks/useCachetaGame';

type Action = 'won' | 'fold' | 'lost' | null;

export const CachetaScreen = () => {
  useScreenOrientation('LANDSCAPE');
  
  const { theme } = useTheme();
  const navigation = useNavigation();
  const horizontalScrollRef = useRef<ScrollView>(null);

  // --- GAME LOGIC ---
  const game = useCachetaGame(horizontalScrollRef);

  // --- UI STATES ---
  const [showEditName, setShowEditName] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  // --- TUTORIAL & LAYOUT ---
  const [layoutReady, setLayoutReady] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Targets
  const targetNames = useTutorialTarget(tutorialActive && tutorialStep === 0);
  const targetActions = useTutorialTarget(tutorialActive && tutorialStep === 1);
  const targetButton = useTutorialTarget(tutorialActive && tutorialStep === 2);

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > height) { 
       setLayoutReady(true);
    }
  };

  useEffect(() => {
    if (!layoutReady) return;
    const checkTutorial = async () => {
      const hasSeen = await getData(STORAGE_KEYS.TUTORIAL_CACHETA);
      if (!hasSeen) {
        setTimeout(() => {
            setTutorialActive(true);
            setTutorialStep(0);
        }, 500);
      }
    };
    checkTutorial();
  }, [layoutReady]);

  const handleNextTutorial = async () => {
    if (tutorialStep < 2) {
      setTutorialStep(prev => prev + 1);
    } else {
      setTutorialActive(false);
      await saveData(STORAGE_KEYS.TUTORIAL_CACHETA, true);
    }
  };

  const getTutorialMessage = () => {
    switch (tutorialStep) {
      case 0: return translate('cacheta.tutorial.step_names');
      case 1: return translate('cacheta.tutorial.step_actions');
      case 2: return translate('cacheta.tutorial.step_button');
      default: return "";
    }
  };

  const getTutorialSpotlight = () => {
    switch (tutorialStep) {
      case 0: return targetNames.layout;
      case 1: return targetActions.layout;
      case 2: return targetButton.layout;
      default: return null;
    }
  };

  const handleDeletePlayer = () => {
    if (!editingPlayerId) return;

    const confirmDelete = () => {
        game.removePlayer(editingPlayerId);
        setShowEditName(false);
    };

    Alert.alert(
      translate('common.delete_player'), 
      translate('common.confirm_delete_player'), 
      [
        { text: translate('common.cancel'), style: 'cancel' },
        { 
          text: translate('common.confirm'), 
          style: 'destructive', 
          onPress: confirmDelete 
        }
      ]
    );
  };

  const handleSavePlayerName = (newName: string) => {
    if (newName.trim() && editingPlayerId) {
        game.setPlayers(prev => prev.map(p => 
            p.id === editingPlayerId ? { ...p, name: newName } : p
        ));
    }
  };

  const getActionColor = (action: Action) => {
    if (action === 'won') return theme.colors.cacheta.win;
    if (action === 'fold') return theme.colors.cacheta.fold;
    if (action === 'lost') return theme.colors.cacheta.loss;
    return 'transparent';
  };

  const getEditingPlayerName = () => game.players.find(p => p.id === editingPlayerId)?.name || '';

  const handleSaveHistory = () => {
    if (editingRoundIdx !== null) {
      const winnersCount = game.players.filter(p => p.history[editingRoundIdx] === 'won').length;
      
      if (winnersCount === 0) {
        Alert.alert(translate('common.error'), translate('cacheta.need_winner'));
        return;
      }
      
      if (winnersCount > 1) {
        Alert.alert(translate('common.error'), translate('cacheta.multiple_winners') || 'Apenas um jogador pode ganhar por rodada.');
        return;
      }
    }
    setShowEditHistory(false);
  };

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <LinearGradient colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text.white }]}>{translate('home.cacheta').toUpperCase()}</Text>
          
          <View style={[styles.headerSide, { justifyContent: 'flex-end' }]}>
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
                <Ionicons name="settings-sharp" size={24} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <ScrollView ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
            
            {/* 1. NOMES */}
            <View style={styles.namesColumn} ref={targetNames.ref} collapsable={false}>
              <View style={styles.cellHeader}><Text style={styles.headerText}>{translate('common.player').toUpperCase()}</Text></View>
              {game.playersWithPoints.map((p) => (
                <View key={p.id}>
                    <TouchableOpacity
                        style={[styles.playerCell, { backgroundColor: theme.colors.truco.cardBackground }]}
                        onPress={() => { setEditingPlayerId(p.id); setShowEditName(true); }}
                    >
                    <Text style={[styles.playerName, { color: theme.colors.text.white }, p.currentPoints <= 0 && styles.outText]} numberOfLines={1}>{p.name}</Text>
                    <Text style={[styles.playerPoints, { color: theme.colors.truco.scoreText }]}>{p.currentPoints}</Text>
                    </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={game.handleAddPlayer}>
                <Ionicons name="add-circle" size={26} color={theme.colors.neon.primary} />
              </TouchableOpacity>
            </View>

            {/* 2. HISTÓRICO */}
            <View style={{ flexDirection: 'row' }}>
              {game.rounds.map((round) => (
                <View key={round.id}>
                    <TouchableOpacity style={styles.historyColumn} onPress={() => { setEditingRoundIdx(round.index); setShowEditHistory(true); }}>
                    <View style={styles.cellHeader}><Text style={styles.headerText}>{translate('common.round')[0]}{round.index + 1}</Text></View>
                    {game.playersWithPoints.map(p => (
                        <View key={p.id} style={[styles.historyCell, { backgroundColor: getActionColor(p.history[round.index]) + '22' }]}>
                        <View style={[styles.dot, { backgroundColor: getActionColor(p.history[round.index]) || theme.colors.truco.divider }]} />
                        </View>
                    ))}
                    </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* 3. AÇÕES */}
            <View style={[styles.activeColumn, { backgroundColor: theme.colors.truco.cardBackground, borderColor: theme.colors.truco.divider }]}>
              <View style={[styles.cellHeaderActive, { backgroundColor: theme.colors.neon.primary + '22' }]}>
                <Text style={[styles.headerText, { color: theme.colors.neon.primary }]}>{translate('cacheta.current')}</Text>
              </View>
              {game.playersWithPoints.map((p, index) => (
                <View key={p.id} style={styles.activeCell} ref={index === 0 ? targetActions.ref : undefined} collapsable={false}>
                  {p.currentPoints > 0 ? (
                    <View style={styles.actionRow}>
                      <ActionCircle theme={theme} label={translate('cacheta.actions.fold')} color={theme.colors.cacheta.fold} active={p.currentAction === 'fold'} onPress={() => game.updateAction(p.id, 'fold')} />
                      <ActionCircle theme={theme} label={translate('cacheta.actions.lost')} color={theme.colors.cacheta.loss} active={p.currentAction === 'lost'} onPress={() => game.updateAction(p.id, 'lost')} />
                      <ActionCircle theme={theme} label={translate('cacheta.actions.won')} color={theme.colors.cacheta.win} active={p.currentAction === 'won'} onPress={() => game.updateAction(p.id, 'won')} />
                    </View>
                  ) : (
                    <Text style={[styles.outLabel, { color: theme.colors.status.error }]}>{translate('cacheta.out_of_game')}</Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        {/* 4. BOTÃO */}
        <View style={styles.footer} ref={targetButton.ref} collapsable={false}>
          <View style={{ width: 220, height: 50 }}>
            <GameButton title={translate('cacheta.next_round')} onPress={game.handleNextRound} />
          </View>
        </View>

      </SafeAreaView>

      {/* OVERLAY: EDITAR HISTÓRICO */}
      {showEditHistory && editingRoundIdx !== null && (
        <TouchableWithoutFeedback onPress={handleSaveHistory}>
          <View style={[styles.absoluteOverlay, { backgroundColor: theme.colors.background.overlay }]}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.overlayContent, { width: '85%', backgroundColor: theme.colors.background.secondary }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.overlayTitle, { color: theme.colors.text.primary }]}>
                    {translate('common.edit_round', { index: editingRoundIdx + 1 })}
                  </Text>
                  <TouchableOpacity onPress={handleSaveHistory}>
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {game.players.map(p => (
                    <View key={p.id} style={[styles.editHistoryRow, { borderBottomColor: theme.colors.modal.divider }]}>
                      <Text style={{ color: theme.colors.text.primary, fontFamily: 'Minecraft', fontSize: 10, flex: 1 }}>{p.name}</Text>
                      <View style={styles.actionRow}>
                        <ActionCircle theme={theme} label={translate('cacheta.actions.fold')} color={theme.colors.cacheta.fold} active={p.history[editingRoundIdx] === 'fold'} onPress={() => game.updateHistoryAction(p.id, 'fold', editingRoundIdx)} />
                        <ActionCircle theme={theme} label={translate('cacheta.actions.lost')} color={theme.colors.cacheta.loss} active={p.history[editingRoundIdx] === 'lost'} onPress={() => game.updateHistoryAction(p.id, 'lost', editingRoundIdx)} />
                        <ActionCircle theme={theme} label={translate('cacheta.actions.won')} color={theme.colors.cacheta.win} active={p.history[editingRoundIdx] === 'won'} onPress={() => game.updateHistoryAction(p.id, 'won', editingRoundIdx)} />
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={[styles.modalFooterRow, { borderTopColor: theme.colors.modal.divider }]}>
                  <TouchableOpacity style={styles.textBtn} onPress={() => game.deleteRound(editingRoundIdx, () => setShowEditHistory(false))}>
                    <Text style={[styles.deleteLinkText, { color: theme.colors.status.error }]}>{translate('cacheta.delete_round')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: theme.colors.brand.primary }]} onPress={handleSaveHistory}>
                    <Text style={[styles.saveBtnText, { color: theme.colors.text.white }]}>{translate('common.save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      <CachetaSettingsModal 
        visible={settingsVisible} onClose={() => setSettingsVisible(false)}
        onReset={() => { game.handleReset(); if(tutorialActive) handleNextTutorial(); }}
        onOpenHelp={() => { setSettingsVisible(false); setHelpVisible(true); }}
        initialPoints={game.initialPoints} setInitialPoints={game.setInitialPoints}
      />

      <CachetaHelpModal visible={helpVisible} onClose={() => { setHelpVisible(false); setSettingsVisible(true); }} />

      <EditNameModal 
        visible={showEditName} initialValue={getEditingPlayerName()} 
        onClose={() => setShowEditName(false)} 
        onSave={handleSavePlayerName} 
        onDelete={handleDeletePlayer}
      />

      {layoutReady && (
        <TutorialOverlay
            visible={tutorialActive}
            spotlight={getTutorialSpotlight()}
            message={getTutorialMessage()}
            onNext={() => { handleNextTutorial(); }}
            nextText={tutorialStep === 2 ? translate('common.got_it') : translate('common.next')}
        />
      )}
    </View>
  );
};

const ActionCircle = ({ label, color, active, onPress, theme }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.circle, { borderColor: color, backgroundColor: active ? color : 'transparent' }]}>
    <Text style={[styles.circleText, { color: active ? theme.colors.text.black : color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 50 },
  headerSide: { flex: 1, flexDirection: 'row' },
  headerTitle: { fontFamily: 'Minecraft', fontSize: 16, textAlign: 'center', flex: 2 },
  iconBtn: { padding: 5 },
  tableScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  namesColumn: { width: 130 },
  cellHeader: { height: 35, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 10, fontFamily: 'Minecraft', color: '#888' },
  playerCell: { height: 55, paddingHorizontal: 12, justifyContent: 'center', marginBottom: 4, borderRadius: 10 },
  playerName: { fontFamily: 'Minecraft', fontSize: 11, marginBottom: 2 },
  playerPoints: { fontSize: 22, fontFamily: 'Minecraft' },
  outText: { textDecorationLine: 'line-through', opacity: 0.5 },
  addBtn: { height: 40, justifyContent: 'center', alignItems: 'center' },
  historyColumn: { width: 45, alignItems: 'center' },
  historyCell: { width: 38, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  activeColumn: { marginLeft: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 1, alignSelf: 'flex-start' },
  cellHeaderActive: { height: 35, justifyContent: 'center', alignItems: 'center' },
  activeCell: { height: 55, justifyContent: 'center', paddingHorizontal: 10, marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 6 },
  circle: { width: 48, height: 38, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  circleText: { fontFamily: 'Minecraft', fontSize: 12 },
  outLabel: { fontFamily: 'Minecraft', fontSize: 8, textAlign: 'center' },
  footer: { height: 60, justifyContent: 'center', alignItems: 'center' },
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  overlayContent: { width: '60%', padding: 20, borderRadius: 20, borderWidth: 1 },
  overlayTitle: { fontFamily: 'Minecraft', fontSize: 14, marginBottom: 15, textAlign: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editHistoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1 },
  modalFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1 },
  textBtn: { paddingVertical: 10 },
  deleteLinkText: { fontFamily: 'Minecraft', fontSize: 10, textDecorationLine: 'underline' },
  saveBtnSmall: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { fontFamily: 'Minecraft', fontSize: 12 }
});