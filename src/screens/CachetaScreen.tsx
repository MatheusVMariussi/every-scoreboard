import React, { useState, useLayoutEffect, useRef, useMemo, useCallback, useEffect } from 'react'; // Adicionado useEffect
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, TextInput, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';

import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { GameButton } from '../components/GameButton';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';

// --- INTERFACES ---
type Action = 'won' | 'fold' | 'lost' | null;

interface Player {
  id: string;
  name: string;
  history: Action[];
  currentAction: Action;
}

export const CachetaScreen = () => {
  useScreenOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);
  
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
  
  // Overlays (Substitutos de Modais para evitar crashes)
  const [showEditName, setShowEditName] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);

  // --- PERSISTÊNCIA DE DADOS ---
  // Carregar dados salvos ao abrir a tela
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

  // Salvar dados sempre que houver mudanças nos jogadores ou pontos iniciais
  useEffect(() => {
    saveData(STORAGE_KEYS.CACHETA_DATA, { players, initialPoints });
  }, [players, initialPoints]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // --- CÁLCULO DINÂMICO DE PONTOS ---
  const playersWithPoints = useMemo(() => {
    return players.map(p => {
      let pts = initialPoints;
      p.history.forEach(act => {
        if (act === 'fold') pts -= 1; // Correu perde 1
        if (act === 'lost') pts -= 2; // Perdeu perde 2
      });
      return { ...p, currentPoints: Math.max(0, pts) };
    });
  }, [players, initialPoints]);

  // --- LÓGICA DE JOGO ---
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
    Alert.alert(translate('common.confirm_reset_title'), translate('common.confirm_reset_message'), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.confirm'), style: 'destructive', onPress: () => {
        setPlayers(prev => prev.map(p => ({ ...p, history: [], currentAction: null })));
      }}
    ]);
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

  // --- VALIDAÇÕES DE OVERLAY ---
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

  const handleDeletePlayer = (id: string) => {
    Alert.alert(translate('common.delete_player'), translate('common.confirm_delete_player'), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.confirm'), style: 'destructive', onPress: () => {
          setPlayers(prev => prev.filter(p => p.id !== id));
          setShowEditName(false);
      }}
    ]);
  };

  const getActionColor = (action: Action) => {
    if (action === 'won') return theme.colors.status.success;
    if (action === 'fold') return '#FFD700'; // Amarelo
    if (action === 'lost') return '#FF8C00'; // Laranja
    return 'transparent';
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        
        {/* HEADER SIMÉTRICO */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{translate('home.cacheta').toUpperCase()}</Text>
          <View style={[styles.headerSide, { justifyContent: 'flex-end', gap: 10 }]}>
            <TouchableOpacity style={styles.pointsBadge} onPress={() => Alert.prompt(translate('cacheta.initial_points'), "", (t) => setInitialPoints(parseInt(t) || 10), 'plain-text', initialPoints.toString(), 'number-pad')}>
               <Ionicons name="options-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
               <Text style={styles.badgeText}>{initialPoints} {translate('cacheta.points_abbr')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={styles.iconBtn}>
                <Ionicons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MESA DE JOGO */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <ScrollView ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
            
            {/* JOGADORES */}
            <View style={styles.namesColumn}>
              <View style={styles.cellHeader}><Text style={styles.headerText}>JOGADOR</Text></View>
              {playersWithPoints.map(p => (
                <TouchableOpacity key={p.id} style={[styles.playerCell, { backgroundColor: theme.colors.truco.cardBackground }]} onPress={() => { setEditingPlayerId(p.id); setTempName(p.name); setShowEditName(true); }}>
                  <Text style={[styles.playerName, p.currentPoints <= 0 && styles.outText]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.playerPoints, { color: theme.colors.truco.scoreText }]}>{p.currentPoints}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={() => setPlayers([...players, { id: Date.now().toString(), name: `JOGADOR ${players.length + 1}`, history: [], currentAction: null }])}>
                <Ionicons name="add-circle" size={26} color={theme.colors.neon.primary} />
              </TouchableOpacity>
            </View>

            {/* HISTÓRICO ANTERIOR */}
            <View style={{ flexDirection: 'row' }}>
              {players[0].history.map((_, rIdx) => (
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

            {/* RODADA ATUAL */}
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

      {/* OVERLAY: EDIÇÃO DE NOME */}
      {showEditName && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.absoluteOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.overlayContent, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.overlayTitle, { color: theme.colors.text.primary, flex: 1, textAlign: 'left' }]}>{translate('common.edit_name')}</Text>
                  <TouchableOpacity onPress={() => handleDeletePlayer(editingPlayerId!)} style={{ padding: 5 }}>
                    <Ionicons name="trash-outline" size={22} color={theme.colors.status.error} />
                  </TouchableOpacity>
                </View>
                
                <TextInput 
                    style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.text.secondary }]} 
                    value={tempName} onChangeText={setTempName} autoFocus maxLength={12} 
                />

                <View style={styles.overlayButtons}>
                  <TouchableOpacity onPress={() => setShowEditName(false)}><Text style={{ color: theme.colors.status.error, fontFamily: 'Minecraft' }}>{translate('common.cancel')}</Text></TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => { setPlayers(prev => prev.map(p => p.id === editingPlayerId ? { ...p, name: tempName } : p)); setShowEditName(false); Keyboard.dismiss(); }} 
                    style={styles.saveBtn}
                  >
                    <Text style={{ color: '#FFF', fontFamily: 'Minecraft' }}>{translate('common.save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

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
  pointsBadge: { backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  badgeText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 10 },
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
  activeColumn: { width: 190, marginLeft: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
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
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontFamily: 'Minecraft', fontSize: 14, marginBottom: 20 },
  overlayButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  saveBtn: { backgroundColor: '#FF9F00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editHistoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  textBtn: { paddingVertical: 10 },
  deleteLinkText: { color: '#FF3B30', fontFamily: 'Minecraft', fontSize: 10, textDecorationLine: 'underline' },
  saveBtnSmall: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 12 }
});