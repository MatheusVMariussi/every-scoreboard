import React, { useState, useLayoutEffect, useRef, useMemo, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Keyboard, TouchableWithoutFeedback 
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

// --- INTERFACES ---
type Action = 'won' | 'fold' | 'lost' | null;

interface Player {
  id: string;
  name: string;
  history: Action[];
  currentAction: Action;
}

export const CachetaScreen = () => {
  // Força Landscape com segurança
  useScreenOrientation('LANDSCAPE');
  
  const { theme } = useTheme();
  const navigation = useNavigation();
  const horizontalScrollRef = useRef<ScrollView>(null);

  // --- ESTADOS ---
  const [initialPoints, setInitialPoints] = useState(10);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'JOGADOR 1', history: [], currentAction: null },
    { id: '2', name: 'JOGADOR 2', history: [], currentAction: null },
    { id: '3', name: 'JOGADOR 3', history: [], currentAction: null },
  ]);
  
  // MODAIS
  const [showEditName, setShowEditName] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);

  const [settingsVisible, setSettingsVisible] = useState(false); // <--- NOVO ESTADO

  useEffect(() => {
    const loadData = async () => {
      const saved = await getData(STORAGE_KEYS.CACHETA_DATA);
      if (saved) {
        setPlayers(saved.players);
        setInitialPoints(saved.initialPoints);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    saveData(STORAGE_KEYS.CACHETA_DATA, { players, initialPoints });
  }, [players, initialPoints]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const playersWithPoints = useMemo(() => {
    return players.map(p => {
      let pts = initialPoints;
      p.history.forEach(act => {
        if (act === 'fold') pts -= 1;
        if (act === 'lost') pts -= 2;
      });
      return { ...p, currentPoints: Math.max(0, pts) };
    });
  }, [players, initialPoints]);

  const handleNextRound = () => {
    const hasWinner = players.some(p => p.currentAction === 'won');
    const alive = playersWithPoints.filter(p => p.currentPoints > 0);

    if (!hasWinner && alive.length > 0) {
      Alert.alert(translate('common.error'), translate('cacheta.need_winner'));
      return;
    }

    setPlayers(prev => prev.map(p => ({
      ...p,
      history: [...p.history, p.currentAction],
      currentAction: null
    })));

    setTimeout(() => horizontalScrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const handleReset = () => {
    // A lógica de confirmação já está dentro do modal, mas podemos manter uma verificação extra se quiser
    setPlayers(prev => prev.map(p => ({ ...p, history: [], currentAction: null })));
  };

  const updateAction = (pId: string, action: Action, isHistory = false) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== pId) return p;
      if (isHistory && editingRoundIdx !== null) {
        const newH = [...p.history];
        newH[editingRoundIdx] = action === newH[editingRoundIdx] ? null : action;
        return { ...p, history: newH };
      }
      return { ...p, currentAction: action === p.currentAction ? null : action };
    }));
  };

  const handleSaveHistory = () => {
    if (editingRoundIdx !== null) {
      const hasWinner = players.some(p => p.history[editingRoundIdx] === 'won');
      if (!hasWinner) {
        Alert.alert(translate('common.error'), translate('cacheta.need_winner'));
        return;
      }
    }
    setShowEditHistory(false);
  };

  const handleAddPlayer = () => {
    setPlayers(prev => {
      const currentRounds = prev.length > 0 ? prev[0].history.length : 0;
      const penaltyHistory: Action[] = Array(currentRounds).fill('lost');
      const newPlayer: Player = { 
        id: Date.now().toString(), 
        name: `JOGADOR ${prev.length + 1}`, 
        history: penaltyHistory, 
        currentAction: null 
      };
      return [...prev, newPlayer];
    });
  };

  const handleDeletePlayer = () => {
    if (!editingPlayerId) return;
    
    Alert.alert(translate('common.delete_player'), translate('common.confirm_delete_player'), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.confirm'), style: 'destructive', onPress: () => {
          setPlayers(prev => prev.filter(p => p.id !== editingPlayerId));
          setShowEditName(false);
      }}
    ]);
  };

  const getActionColor = (action: Action) => {
    if (action === 'won') return theme.colors.status.success;
    if (action === 'fold') return '#FFD700'; 
    if (action === 'lost') return '#FF8C00'; 
    return 'transparent';
  };

  const getEditingPlayerName = () => {
    const player = players.find(p => p.id === editingPlayerId);
    return player ? player.name : '';
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        
        {/* HEADER LIMPO E SIMÉTRICO */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.headerTitle}>{translate('home.cacheta').toUpperCase()}</Text>
          
          <View style={[styles.headerSide, { justifyContent: 'flex-end' }]}>
            {/* Botão de Settings (Engrenagem) */}
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
                <Ionicons name="settings-sharp" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <ScrollView ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
            
            <View style={styles.namesColumn}>
              <View style={styles.cellHeader}><Text style={styles.headerText}>JOGADOR</Text></View>
              {playersWithPoints.map(p => (
                <TouchableOpacity 
                    key={p.id} 
                    style={[styles.playerCell, { backgroundColor: theme.colors.truco.cardBackground }]} 
                    onPress={() => { setEditingPlayerId(p.id); setShowEditName(true); }}
                >
                  <Text style={[styles.playerName, p.currentPoints <= 0 && styles.outText]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.playerPoints, { color: theme.colors.truco.scoreText }]}>{p.currentPoints}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}>
                <Ionicons name="add-circle" size={26} color={theme.colors.neon.primary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {players.length > 0 && players[0].history.map((_, rIdx) => (
                <TouchableOpacity key={rIdx} style={styles.historyColumn} onPress={() => { setEditingRoundIdx(rIdx); setShowEditHistory(true); }}>
                  <View style={styles.cellHeader}><Text style={styles.headerText}>R{rIdx + 1}</Text></View>
                  {playersWithPoints.map(p => (
                    <View key={p.id} style={[styles.historyCell, { backgroundColor: getActionColor(p.history[rIdx]) + '22' }]}>
                      <View style={[styles.dot, { backgroundColor: getActionColor(p.history[rIdx]) || 'rgba(255,255,255,0.1)' }]} />
                    </View>
                  ))}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.activeColumn, { backgroundColor: theme.colors.truco.cardBackground }]}>
              <View style={[styles.cellHeaderActive, { backgroundColor: theme.colors.neon.primary + '22' }]}>
                <Text style={[styles.headerText, { color: theme.colors.neon.primary }]}>ATUAL</Text>
              </View>
              {playersWithPoints.map(p => (
                <View key={p.id} style={styles.activeCell}>
                  {p.currentPoints > 0 ? (
                    <View style={styles.actionRow}>
                      <ActionCircle label="C" color="#FFD700" active={p.currentAction === 'fold'} onPress={() => updateAction(p.id, 'fold')} />
                      <ActionCircle label="P" color="#FF8C00" active={p.currentAction === 'lost'} onPress={() => updateAction(p.id, 'lost')} />
                      <ActionCircle label="G" color={theme.colors.status.success} active={p.currentAction === 'won'} onPress={() => updateAction(p.id, 'won')} />
                    </View>
                  ) : (
                    <Text style={styles.outLabel}>{translate('cacheta.out_of_game')}</Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          <View style={{ width: 220, height: 50 }}>
            <GameButton title={translate('cacheta.next_round')} onPress={handleNextRound} />
          </View>
        </View>

      </SafeAreaView>

      {/* NOVO MODAL DE SETTINGS */}
      <CachetaSettingsModal 
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onReset={handleReset}
        initialPoints={initialPoints}
        setInitialPoints={setInitialPoints}
      />

      <EditNameModal 
        visible={showEditName} 
        initialValue={getEditingPlayerName()} 
        onClose={() => setShowEditName(false)} 
        onSave={(newName) => {
            if (newName.trim() && editingPlayerId) {
                setPlayers(prev => prev.map(p => p.id === editingPlayerId ? { ...p, name: newName } : p));
            }
        }}
        onDelete={handleDeletePlayer}
      />

      {/* OVERLAY: EDIÇÃO DE HISTÓRICO */}
      {showEditHistory && editingRoundIdx !== null && (
        <TouchableWithoutFeedback onPress={handleSaveHistory}>
          <View style={styles.absoluteOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.overlayContent, { width: '85%', backgroundColor: theme.colors.background.secondary }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.overlayTitle, { color: theme.colors.text.primary }]}>
                    {translate('cacheta.edit_round', { index: editingRoundIdx + 1 })}
                  </Text>
                  <TouchableOpacity onPress={handleSaveHistory}>
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {players.map(p => (
                    <View key={p.id} style={styles.editHistoryRow}>
                      <Text style={{ color: theme.colors.text.primary, fontFamily: 'Minecraft', fontSize: 10, flex: 1 }}>{p.name}</Text>
                      <View style={styles.actionRow}>
                        <ActionCircle label="C" color="#FFD700" active={p.history[editingRoundIdx] === 'fold'} onPress={() => updateAction(p.id, 'fold', true)} />
                        <ActionCircle label="P" color="#FF8C00" active={p.history[editingRoundIdx] === 'lost'} onPress={() => updateAction(p.id, 'lost', true)} />
                        <ActionCircle label="G" color={theme.colors.status.success} active={p.history[editingRoundIdx] === 'won'} onPress={() => updateAction(p.id, 'won', true)} />
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalFooterRow}>
                  <TouchableOpacity style={styles.textBtn} onPress={() => {
                    Alert.alert(translate('cacheta.delete_round'), translate('cacheta.confirm_delete_round'), [
                      { text: translate('common.cancel'), style: 'cancel' },
                      { text: translate('common.confirm'), style: 'destructive', onPress: () => {
                          setPlayers(prev => prev.map(p => { const h = [...p.history]; h.splice(editingRoundIdx, 1); return { ...p, history: h }; }));
                          setShowEditHistory(false);
                      }}
                    ]);
                  }}>
                    <Text style={styles.deleteLinkText}>{translate('cacheta.delete_round')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: theme.colors.brand.primary }]} onPress={handleSaveHistory}>
                    <Text style={styles.saveBtnText}>{translate('common.save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

// --- COMPONENTES AUXILIARES ---
const ActionCircle = ({ label, color, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.circle, { borderColor: color, backgroundColor: active ? color : 'transparent' }]}>
    <Text style={[styles.circleText, { color: active ? '#000' : color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 50 },
  headerSide: { flex: 1, flexDirection: 'row' },
  headerTitle: { fontFamily: 'Minecraft', color: '#FFF', fontSize: 16, textAlign: 'center', flex: 2 },
  iconBtn: { padding: 5 },
  tableScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  namesColumn: { width: 130 },
  cellHeader: { height: 35, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 10, fontFamily: 'Minecraft', color: '#888' },
  playerCell: { height: 55, paddingHorizontal: 12, justifyContent: 'center', marginBottom: 4, borderRadius: 10 },
  playerName: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 11, marginBottom: 2 },
  playerPoints: { fontSize: 22, fontFamily: 'Minecraft' },
  outText: { textDecorationLine: 'line-through', opacity: 0.5 },
  addBtn: { height: 40, justifyContent: 'center', alignItems: 'center' },
  historyColumn: { width: 45, alignItems: 'center' },
  historyCell: { width: 38, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  activeColumn: { marginLeft: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start' },
  cellHeaderActive: { height: 35, justifyContent: 'center', alignItems: 'center' },
  activeCell: { height: 55, justifyContent: 'center', paddingHorizontal: 10, marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 6 },
  circle: { width: 48, height: 38, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  circleText: { fontFamily: 'Minecraft', fontSize: 12 },
  outLabel: { color: '#FF3B30', fontFamily: 'Minecraft', fontSize: 8, textAlign: 'center' },
  footer: { height: 60, justifyContent: 'center', alignItems: 'center' },
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  overlayContent: { width: '60%', padding: 20, borderRadius: 20, borderWidth: 1 },
  overlayTitle: { fontFamily: 'Minecraft', fontSize: 14, marginBottom: 15, textAlign: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editHistoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  textBtn: { paddingVertical: 10 },
  deleteLinkText: { color: '#FF3B30', fontFamily: 'Minecraft', fontSize: 10, textDecorationLine: 'underline' },
  saveBtnSmall: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 12 }
});