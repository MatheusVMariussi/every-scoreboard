import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { GameButton } from '../components/GameButton';
import { useTransitionBack } from '../hooks/useTransitionBack';
import { getData, saveData, STORAGE_KEYS } from '../utils/storage';
import { EditNameModal } from '../components/EditNameModal';
import { CachetaSettingsModal } from '../components/CachetaSettingsModal';
import { CachetaHelpModal } from '../components/CachetaHelpModal';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useTutorialTarget } from '../hooks/useTutorialTarget';
import { useCachetaGame } from '../hooks/useCachetaGame';
import { ms, wp } from '../theme/responsive';
import { getVoiceLocale, VoiceFooter, VoicePanel } from '../components/voice/VoiceFooter';
import { useVoiceScoring } from '../voice/useVoiceScoring';
import { toCachetaBatch, type PendingState } from '../voice/pendingQueue';

type Action = 'won' | 'fold' | 'lost' | null;

export const CachetaScreen = () => {
  useTransitionBack();

  const { theme } = useTheme();
  const navigation = useNavigation();
  const horizontalScrollRef = useRef<ScrollView>(null);

  const game = useCachetaGame(horizontalScrollRef);

  const [showEditName, setShowEditName] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const [layoutReady, setLayoutReady] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const voice = useVoiceScoring({
    game: 'cacheta',
    // Fixado na montagem: a gramática e o reconhecedor seguem o idioma do app.
    locale: getVoiceLocale(),
    players: game.players,
    // Aprovar aplica e fecha a rodada. Se a validação barrar, o hook mostra o Alert de
    // sempre e devolve false — a fila fica intacta para o usuário corrigir e reaprovar
    // (aplicar é idempotente, então reaprovar não duplica nada).
    onApply: (pending: PendingState, advance: boolean) =>
      game.applyVoiceEntries(toCachetaBatch(pending), advance),
  });

  const targetNames = useTutorialTarget(tutorialActive && tutorialStep === 0);
  const targetActions = useTutorialTarget(tutorialActive && tutorialStep === 1);
  const targetButton = useTutorialTarget(tutorialActive && tutorialStep === 2);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
      setTutorialStep((prev) => prev + 1);
    } else {
      setTutorialActive(false);
      await saveData(STORAGE_KEYS.TUTORIAL_CACHETA, true);
    }
  };

  const getTutorialMessage = () => {
    switch (tutorialStep) {
      case 0:
        return translate('cacheta.tutorial.step_names');
      case 1:
        return translate('cacheta.tutorial.step_actions');
      case 2:
        return translate('cacheta.tutorial.step_button');
      default:
        return '';
    }
  };

  const getTutorialSpotlight = () => {
    switch (tutorialStep) {
      case 0:
        return targetNames.layout;
      case 1:
        return targetActions.layout;
      case 2:
        return targetButton.layout;
      default:
        return null;
    }
  };

  const handleDeletePlayer = () => {
    if (!editingPlayerId) return;

    const confirmDelete = () => {
      game.removePlayer(editingPlayerId);
      setShowEditName(false);
    };

    Alert.alert(translate('common.delete_player'), translate('common.confirm_delete_player'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.confirm'),
        style: 'destructive',
        onPress: confirmDelete,
      },
    ]);
  };

  const handleSavePlayerName = (newName: string) => {
    if (newName.trim() && editingPlayerId) {
      game.setPlayers((prev) =>
        prev.map((p) => (p.id === editingPlayerId ? { ...p, name: newName } : p)),
      );
    }
  };

  const getActionColor = (action: Action) => {
    if (action === 'won') return theme.colors.cacheta.win;
    if (action === 'fold') return theme.colors.cacheta.fold;
    if (action === 'lost') return theme.colors.cacheta.loss;
    return 'transparent';
  };

  const getEditingPlayerName = () => game.players.find((p) => p.id === editingPlayerId)?.name || '';

  const handleSaveHistory = () => {
    if (editingRoundIdx !== null) {
      const winnersCount = game.players.filter((p) => p.history[editingRoundIdx] === 'won').length;

      if (winnersCount === 0) {
        Alert.alert(translate('common.error'), translate('cacheta.need_winner'));
        return;
      }

      if (winnersCount > 1) {
        Alert.alert(
          translate('common.error'),
          translate('cacheta.multiple_winners') || 'Apenas um jogador pode ganhar por rodada.',
        );
        return;
      }
    }
    setShowEditHistory(false);
  };

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <LinearGradient
        colors={[theme.colors.truco.backgroundTop, theme.colors.truco.backgroundBottom]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
              }}
              style={styles.iconBtn}
            >
              <Ionicons name="arrow-back" size={ms(24)} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.headerTitle, { color: theme.colors.text.white }]}>
            {translate('home.cacheta').toUpperCase()}
          </Text>

          <View style={[styles.headerSide, { justifyContent: 'flex-end' }]}>
            <TouchableOpacity
              onPress={() => {
                setSettingsVisible(true);
              }}
              style={styles.iconBtn}
            >
              <Ionicons name="settings-sharp" size={ms(24)} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tableScroll}
          >
            {/* 1. NOMES */}
            <View style={styles.namesColumn} ref={targetNames.ref} collapsable={false}>
              <View style={styles.cellHeader}>
                <Text style={styles.headerText}>{translate('common.player').toUpperCase()}</Text>
              </View>
              {game.playersWithPoints.map((p) => (
                <View key={p.id}>
                  <TouchableOpacity
                    style={[
                      styles.playerCell,
                      { backgroundColor: theme.colors.truco.cardBackground },
                    ]}
                    onPress={() => {
                      setEditingPlayerId(p.id);
                      setShowEditName(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.playerName,
                        { color: theme.colors.text.white },
                        p.currentPoints <= 0 && styles.outText,
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <Text style={[styles.playerPoints, { color: theme.colors.truco.scoreText }]}>
                      {p.currentPoints}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={game.handleAddPlayer}>
                <Ionicons name="add-circle" size={ms(26)} color={theme.colors.neon.primary} />
              </TouchableOpacity>
            </View>

            {/* 2. HISTÓRICO */}
            <View style={{ flexDirection: 'row' }}>
              {game.rounds.map((round) => (
                <View key={round.id}>
                  <TouchableOpacity
                    style={styles.historyColumn}
                    onPress={() => {
                      setEditingRoundIdx(round.index);
                      setShowEditHistory(true);
                    }}
                  >
                    <View style={styles.cellHeader}>
                      <Text style={styles.headerText}>
                        {translate('common.round')[0]}
                        {round.index + 1}
                      </Text>
                    </View>
                    {game.playersWithPoints.map((p) => (
                      <View
                        key={p.id}
                        style={[
                          styles.historyCell,
                          { backgroundColor: getActionColor(p.history[round.index]) + '22' },
                        ]}
                      >
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor:
                                getActionColor(p.history[round.index]) ||
                                theme.colors.truco.divider,
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* 3. AÇÕES */}
            <View
              style={[
                styles.activeColumn,
                {
                  backgroundColor: theme.colors.truco.cardBackground,
                  borderColor: theme.colors.truco.divider,
                },
              ]}
            >
              <View
                style={[
                  styles.cellHeaderActive,
                  { backgroundColor: theme.colors.neon.primary + '22' },
                ]}
              >
                <Text style={[styles.headerText, { color: theme.colors.neon.primary }]}>
                  {translate('cacheta.current')}
                </Text>
              </View>
              {game.playersWithPoints.map((p, index) => (
                <View
                  key={p.id}
                  style={styles.activeCell}
                  ref={index === 0 ? targetActions.ref : undefined}
                  collapsable={false}
                >
                  {p.currentPoints > 0 ? (
                    <View style={styles.actionRow}>
                      <ActionCircle
                        theme={theme}
                        label={translate('cacheta.actions.fold')}
                        color={theme.colors.cacheta.fold}
                        active={p.currentAction === 'fold'}
                        onPress={() => {
                          game.updateAction(p.id, 'fold');
                        }}
                      />
                      <ActionCircle
                        theme={theme}
                        label={translate('cacheta.actions.lost')}
                        color={theme.colors.cacheta.loss}
                        active={p.currentAction === 'lost'}
                        onPress={() => {
                          game.updateAction(p.id, 'lost');
                        }}
                      />
                      <ActionCircle
                        theme={theme}
                        label={translate('cacheta.actions.won')}
                        color={theme.colors.cacheta.win}
                        active={p.currentAction === 'won'}
                        onPress={() => {
                          game.updateAction(p.id, 'won');
                        }}
                      />
                    </View>
                  ) : (
                    <Text style={[styles.outLabel, { color: theme.colors.status.error }]}>
                      {translate('cacheta.out_of_game')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        {/* 4. BOTÃO */}
        <View style={styles.footer} ref={targetButton.ref} collapsable={false}>
          <VoiceFooter voice={voice} players={game.players} />
          <View style={{ width: ms(220), height: ms(50) }}>
            <GameButton title={translate('cacheta.next_round')} onPress={game.handleNextRound} />
          </View>
        </View>
      </SafeAreaView>

      {/* OVERLAY: EDITAR HISTÓRICO */}
      {showEditHistory && editingRoundIdx !== null && (
        <TouchableWithoutFeedback onPress={handleSaveHistory}>
          <View
            style={[styles.absoluteOverlay, { backgroundColor: theme.colors.background.overlay }]}
          >
            <TouchableWithoutFeedback
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <View
                style={[
                  styles.overlayContent,
                  { width: wp('85%'), backgroundColor: theme.colors.background.secondary },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.overlayTitle, { color: theme.colors.text.primary }]}>
                    {translate('common.edit_round', { index: editingRoundIdx + 1 })}
                  </Text>
                  <TouchableOpacity onPress={handleSaveHistory}>
                    <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: ms(200) }} showsVerticalScrollIndicator={false}>
                  {game.players.map((p) => (
                    <View
                      key={p.id}
                      style={[
                        styles.editHistoryRow,
                        { borderBottomColor: theme.colors.modal.divider },
                      ]}
                    >
                      <Text
                        style={{
                          color: theme.colors.text.primary,
                          fontFamily: 'Minecraft',
                          fontSize: ms(10),
                          flex: 1,
                        }}
                      >
                        {p.name}
                      </Text>
                      <View style={styles.actionRow}>
                        <ActionCircle
                          theme={theme}
                          label={translate('cacheta.actions.fold')}
                          color={theme.colors.cacheta.fold}
                          active={p.history[editingRoundIdx] === 'fold'}
                          onPress={() => {
                            game.updateHistoryAction(p.id, 'fold', editingRoundIdx);
                          }}
                        />
                        <ActionCircle
                          theme={theme}
                          label={translate('cacheta.actions.lost')}
                          color={theme.colors.cacheta.loss}
                          active={p.history[editingRoundIdx] === 'lost'}
                          onPress={() => {
                            game.updateHistoryAction(p.id, 'lost', editingRoundIdx);
                          }}
                        />
                        <ActionCircle
                          theme={theme}
                          label={translate('cacheta.actions.won')}
                          color={theme.colors.cacheta.win}
                          active={p.history[editingRoundIdx] === 'won'}
                          onPress={() => {
                            game.updateHistoryAction(p.id, 'won', editingRoundIdx);
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View
                  style={[styles.modalFooterRow, { borderTopColor: theme.colors.modal.divider }]}
                >
                  <TouchableOpacity
                    style={styles.textBtn}
                    onPress={() => {
                      game.deleteRound(editingRoundIdx, () => {
                        setShowEditHistory(false);
                      });
                    }}
                  >
                    <Text style={[styles.deleteLinkText, { color: theme.colors.status.error }]}>
                      {translate('cacheta.delete_round')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtnSmall, { backgroundColor: theme.colors.brand.primary }]}
                    onPress={handleSaveHistory}
                  >
                    <Text style={[styles.saveBtnText, { color: theme.colors.text.white }]}>
                      {translate('common.save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      <CachetaSettingsModal
        visible={settingsVisible}
        onClose={() => {
          setSettingsVisible(false);
        }}
        onReset={() => {
          game.handleReset();
          if (tutorialActive) handleNextTutorial();
        }}
        onOpenHelp={() => {
          setSettingsVisible(false);
          setHelpVisible(true);
        }}
        initialPoints={game.initialPoints}
        setInitialPoints={game.setInitialPoints}
      />

      <CachetaHelpModal
        visible={helpVisible}
        onClose={() => {
          setHelpVisible(false);
          setSettingsVisible(true);
        }}
      />

      <EditNameModal
        visible={showEditName}
        initialValue={getEditingPlayerName()}
        onClose={() => {
          setShowEditName(false);
        }}
        onSave={handleSavePlayerName}
        onDelete={handleDeletePlayer}
      />

      {/* Painel da fila: na raiz, senão o Android não entrega toque fora do rodapé. */}
      <VoicePanel voice={voice} players={game.players} />

      {layoutReady && (
        <TutorialOverlay
          visible={tutorialActive}
          spotlight={getTutorialSpotlight()}
          message={getTutorialMessage()}
          onNext={() => {
            handleNextTutorial();
          }}
          nextText={tutorialStep === 2 ? translate('common.got_it') : translate('common.next')}
        />
      )}
    </View>
  );
};

const ActionCircle = ({ label, color, active, onPress, theme }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.circle, { borderColor: color, backgroundColor: active ? color : 'transparent' }]}
  >
    <Text style={[styles.circleText, { color: active ? theme.colors.text.black : color }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(20), height: ms(50) },
  headerSide: { flex: 1, flexDirection: 'row' },
  headerTitle: { fontFamily: 'Minecraft', fontSize: ms(16), textAlign: 'center', flex: 2 },
  iconBtn: { padding: ms(5) },
  tableScroll: { paddingHorizontal: ms(20), paddingBottom: ms(20) },
  namesColumn: { width: ms(130) },
  cellHeader: { height: ms(35), justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: ms(10), fontFamily: 'Minecraft', color: '#888' },
  playerCell: {
    height: ms(55),
    paddingHorizontal: ms(12),
    justifyContent: 'center',
    marginBottom: ms(4),
    borderRadius: ms(10),
  },
  playerName: { fontFamily: 'Minecraft', fontSize: ms(11), marginBottom: ms(2) },
  playerPoints: { fontSize: ms(22), fontFamily: 'Minecraft' },
  outText: { textDecorationLine: 'line-through', opacity: 0.5 },
  addBtn: { height: ms(40), justifyContent: 'center', alignItems: 'center' },
  historyColumn: { width: ms(45), alignItems: 'center' },
  historyCell: {
    width: ms(38),
    height: ms(55),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(4),
  },
  dot: { width: ms(10), height: ms(10), borderRadius: ms(5) },
  activeColumn: {
    marginLeft: ms(15),
    borderRadius: ms(12),
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  cellHeaderActive: { height: ms(35), justifyContent: 'center', alignItems: 'center' },
  activeCell: {
    height: ms(55),
    justifyContent: 'center',
    paddingHorizontal: ms(10),
    marginBottom: ms(4),
  },
  actionRow: { flexDirection: 'row', gap: ms(6) },
  circle: {
    width: ms(48),
    height: ms(38),
    borderRadius: ms(10),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: { fontFamily: 'Minecraft', fontSize: ms(12) },
  outLabel: { fontFamily: 'Minecraft', fontSize: ms(8), textAlign: 'center' },
  footer: { height: ms(60), justifyContent: 'center', alignItems: 'center' },
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayContent: { padding: ms(20), borderRadius: ms(20), borderWidth: 1 },
  overlayTitle: {
    fontFamily: 'Minecraft',
    fontSize: ms(14),
    marginBottom: ms(15),
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(15),
  },
  editHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(10),
    paddingBottom: ms(10),
    borderBottomWidth: 1,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ms(15),
    paddingTop: ms(10),
    borderTopWidth: 1,
  },
  textBtn: { paddingVertical: ms(10) },
  deleteLinkText: { fontFamily: 'Minecraft', fontSize: ms(10), textDecorationLine: 'underline' },
  saveBtnSmall: { paddingHorizontal: ms(25), paddingVertical: ms(10), borderRadius: ms(8) },
  saveBtnText: { fontFamily: 'Minecraft', fontSize: ms(12) },
});
