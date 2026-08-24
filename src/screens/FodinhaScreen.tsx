import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
import { FodinhaSettingsModal } from '../components/FodinhaSettingsModal';
import { FodinhaHelpModal } from '../components/FodinhaHelpModal';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useTutorialTarget } from '../hooks/useTutorialTarget';
import { useFodinhaGame } from '../hooks/useFodinhaGame';
import { ms, wp } from '../theme/responsive';
import { getVoiceLocale, VoiceFooter, VoicePanel } from '../components/voice/VoiceFooter';
import { useVoiceScoring } from '../voice/useVoiceScoring';
import { toFodinhaBatch, type PendingState } from '../voice/pendingQueue';

export const FodinhaScreen = () => {
  useTransitionBack();

  const { theme } = useTheme();
  const navigation = useNavigation();
  const horizontalScrollRef = useRef<ScrollView>(null);

  const game = useFodinhaGame(horizontalScrollRef);

  const [showEditName, setShowEditName] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);

  const [layoutReady, setLayoutReady] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const voice = useVoiceScoring({
    game: 'fodinha',
    // Fixado na montagem: a gramática e o reconhecedor seguem o idioma do app.
    locale: getVoiceLocale(),
    players: game.players,
    // A fase decide se o número falado vira aposta ou vazas, e `cardsInRound` limita o
    // valor já na fila — para o usuário aprovar o que realmente será aplicado.
    phase: game.roundPhase,
    cardsInRound: game.cardsInRound,
    // "matheus fez" soma uma vaza ao que ele já tem, então a fila precisa do valor atual.
    baseline: Object.fromEntries(
      game.players.map((p) => [p.id, game.roundPhase === 'betting' ? p.currentBid : p.currentWon]),
    ),
    onApply: (pending: PendingState, advance: boolean) =>
      game.applyVoiceEntries(toFodinhaBatch(pending), advance),
  });

  const targetCards = useTutorialTarget(tutorialActive && tutorialStep === 0);
  const targetLives = useTutorialTarget(tutorialActive && tutorialStep === 1);
  const targetInputs = useTutorialTarget(tutorialActive && tutorialStep === 2);
  const targetButton = useTutorialTarget(tutorialActive && tutorialStep === 3);

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
      const hasSeen = await getData(STORAGE_KEYS.TUTORIAL_FODINHA);
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
    if (tutorialStep < 3) {
      setTutorialStep((prev) => prev + 1);
    } else {
      setTutorialActive(false);
      await saveData(STORAGE_KEYS.TUTORIAL_FODINHA, true);
    }
  };

  const getTutorialMessage = () => {
    switch (tutorialStep) {
      case 0:
        return translate('fodinha.tutorial.step_cards');
      case 1:
        return translate('fodinha.tutorial.step_lives');
      case 2:
        return translate('fodinha.tutorial.step_inputs');
      case 3:
        return translate('fodinha.tutorial.step_button');
      default:
        return '';
    }
  };

  const getTutorialSpotlight = () => {
    switch (tutorialStep) {
      case 0:
        return targetCards.layout;
      case 1:
        return targetLives.layout;
      case 2:
        return targetInputs.layout;
      case 3:
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
      { text: translate('common.confirm'), style: 'destructive', onPress: confirmDelete },
    ]);
  };

  const getEditingPlayerName = () => game.players.find((p) => p.id === editingPlayerId)?.name || '';

  /**
   * Na fase de resultado o botão só libera com as vazas fechando o número de cartas.
   *
   * Antes ele estava sempre ativo e respondia com um Alert quando a conta não batia — o
   * contador "{total}/{cartas}" logo acima já diz o que falta, então desabilitar comunica
   * a mesma coisa sem interromper.
   *
   * Nas apostas a regra é outra (a soma não PODE fechar), e ali o botão continua livre.
   */
  const canAdvancePhase = game.roundPhase !== 'results' || game.totalWon === game.cardsInRound;

  const getProjectedDamage = (p: any) => {
    const diff = Math.abs(p.currentBid - p.currentWon);
    if (diff === 0) return 0;
    return game.penaltyMode === 'fixed' ? 1 : diff;
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

          <Text style={styles.headerTitle}>{translate('fodinha.title')}</Text>

          <View style={[styles.headerSide, { justifyContent: 'flex-end', gap: ms(10) }]}>
            {(() => {
              const isCardsLocked = game.roundPhase !== 'betting';
              return (
                <View
                  style={[
                    styles.cardsControlContainer,
                    {
                      backgroundColor: theme.colors.fodinha.cardBackground,
                      borderColor: theme.colors.fodinha.divider,
                    },
                    isCardsLocked && {
                      opacity: 0.5,
                      backgroundColor: theme.colors.background.overlay,
                    },
                  ]}
                  ref={targetCards.ref}
                  collapsable={false}
                >
                  <TouchableOpacity
                    onPress={() => {
                      game.setCardsInRound((prev) => Math.max(1, prev - 1));
                    }}
                    style={styles.cardsStepBtn}
                    disabled={isCardsLocked}
                  >
                    <Ionicons
                      name="remove"
                      size={ms(14)}
                      color={isCardsLocked ? theme.colors.text.secondary : theme.colors.text.white}
                    />
                  </TouchableOpacity>

                  <View style={styles.cardsCenter}>
                    <Ionicons
                      name="documents-outline"
                      size={ms(12)}
                      color={theme.colors.text.white}
                      style={{ marginRight: ms(4) }}
                    />
                    <Text style={styles.badgeText}>
                      {game.cardsInRound} {translate('fodinha.cards')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      game.setCardsInRound((prev) => prev + 1);
                    }}
                    style={styles.cardsStepBtn}
                    disabled={isCardsLocked}
                  >
                    <Ionicons
                      name="add"
                      size={ms(14)}
                      color={isCardsLocked ? theme.colors.text.secondary : theme.colors.text.white}
                    />
                  </TouchableOpacity>
                </View>
              );
            })()}

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
            {/* COLUNA NOMES */}
            <View style={styles.namesColumn} ref={targetLives.ref} collapsable={false}>
              <View style={styles.cellHeader}>
                <Text style={styles.headerText}>{translate('common.player').toUpperCase()}</Text>
              </View>
              {game.players.map((p) => (
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
                        p.lives <= 0 && styles.outText,
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <View style={styles.livesContainer}>
                      <Ionicons name="heart" size={ms(12)} color={theme.colors.status.error} />
                      <Text style={[styles.playerPoints, { color: theme.colors.text.white }]}>
                        {p.lives}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={game.handleAddPlayer}>
                <Ionicons name="add-circle" size={ms(26)} color={theme.colors.neon.primary} />
              </TouchableOpacity>
            </View>

            {/* HISTÓRICO */}
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
                      <Text style={styles.headerText}>{round.index + 1}</Text>
                    </View>
                    {game.players.map((p) => {
                      const damage = p.history[round.index];
                      return (
                        <View
                          key={p.id}
                          style={[
                            styles.historyCell,
                            { backgroundColor: theme.colors.fodinha.cardBackground },
                          ]}
                        >
                          {damage === 0 ? (
                            <View
                              style={[
                                styles.safeDot,
                                { backgroundColor: theme.colors.fodinha.safeDot },
                              ]}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.damageText,
                                { color: theme.colors.fodinha.damageText },
                              ]}
                            >
                              -{damage}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* COLUNA ATUAL */}
            <View
              style={[
                styles.activeColumn,
                {
                  backgroundColor: theme.colors.truco.cardBackground,
                  borderColor: theme.colors.fodinha.divider,
                },
              ]}
            >
              <View
                style={[
                  styles.cellHeaderActive,
                  {
                    backgroundColor:
                      game.roundPhase === 'betting'
                        ? theme.colors.status.warning
                        : theme.colors.neon.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headerText,
                    { color: theme.colors.text.black, fontWeight: 'bold' },
                  ]}
                >
                  {game.roundPhase === 'betting'
                    ? translate('fodinha.bets')
                    : translate('fodinha.results')}
                </Text>
              </View>

              {game.players.map((p, index) => {
                if (p.lives <= 0)
                  return (
                    <View key={p.id} style={styles.activeCell}>
                      <Text style={[styles.outLabel, { color: theme.colors.fodinha.eliminated }]}>
                        {translate('fodinha.eliminated')}
                      </Text>
                    </View>
                  );
                const projectedDamage = getProjectedDamage(p);

                return (
                  <View
                    key={p.id}
                    style={[styles.activeCell, { borderBottomColor: theme.colors.fodinha.divider }]}
                    ref={index === 0 ? targetInputs.ref : undefined}
                    collapsable={false}
                  >
                    <View
                      style={[
                        styles.stepperContainer,
                        { backgroundColor: theme.colors.background.overlay },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          game.adjustValue(p.id, -1);
                        }}
                        style={[styles.stepBtn, { backgroundColor: theme.colors.fodinha.divider }]}
                      >
                        <Ionicons name="remove" size={ms(16)} color={theme.colors.text.white} />
                      </TouchableOpacity>
                      <Text style={[styles.mainValue, { color: theme.colors.text.white }]}>
                        {game.roundPhase === 'betting' ? p.currentBid : p.currentWon}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          game.adjustValue(p.id, 1);
                        }}
                        style={[styles.stepBtn, { backgroundColor: theme.colors.fodinha.divider }]}
                      >
                        <Ionicons name="add" size={ms(16)} color={theme.colors.text.white} />
                      </TouchableOpacity>
                    </View>
                    {game.roundPhase === 'results' && (
                      <View style={styles.feedbackContainer}>
                        <Text
                          style={{
                            fontSize: ms(8),
                            color: theme.colors.text.secondary,
                            fontFamily: 'Minecraft',
                          }}
                        >
                          {translate('fodinha.bet')}: {p.currentBid}
                        </Text>
                        {projectedDamage > 0 ? (
                          <Text
                            style={{
                              fontSize: ms(10),
                              color: theme.colors.fodinha.damageText,
                              fontFamily: 'Minecraft',
                            }}
                          >
                            -{projectedDamage}
                          </Text>
                        ) : (
                          <Ionicons
                            name="checkmark-circle"
                            size={ms(12)}
                            color={theme.colors.status.success}
                          />
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
              <View
                style={[styles.columnFooter, { backgroundColor: theme.colors.background.overlay }]}
              >
                <Text
                  style={[
                    styles.footerInfo,
                    {
                      color:
                        (game.roundPhase === 'betting' && game.totalBids === game.cardsInRound) ||
                        (game.roundPhase === 'results' && game.totalWon !== game.cardsInRound)
                          ? theme.colors.status.error
                          : theme.colors.text.white,
                    },
                  ]}
                >
                  {translate('fodinha.total')}:{' '}
                  {game.roundPhase === 'betting' ? game.totalBids : game.totalWon}/
                  {game.cardsInRound}
                </Text>
              </View>
            </View>
          </ScrollView>
        </ScrollView>

        <View style={styles.footer} ref={targetButton.ref} collapsable={false}>
          <VoiceFooter voice={voice} players={game.players} />
          <View style={{ width: ms(250), height: ms(50) }}>
            <GameButton
              title={
                game.roundPhase === 'betting'
                  ? translate('fodinha.confirm_bets')
                  : translate('fodinha.finish_round')
              }
              onPress={game.handlePhaseChange}
              variant={game.roundPhase === 'betting' ? 'secondary' : 'primary'}
              disabled={!canAdvancePhase}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* OVERLAY: EDITAR HISTÓRICO */}
      {showEditHistory && editingRoundIdx !== null && (
        <View
          style={[styles.absoluteOverlay, { backgroundColor: theme.colors.background.overlay }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setShowEditHistory(false);
            }}
          />
          <View
            style={[
              styles.overlayContent,
              {
                width: wp('50%'),
                maxHeight: '85%',
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.text.secondary,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.overlayTitle, { color: theme.colors.text.primary }]}>
                {translate('common.edit_round', { index: editingRoundIdx + 1 })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditHistory(false);
                }}
              >
                <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexShrink: 1 }}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: ms(20) }}
              >
                {game.players.map((p) => {
                  const damage = p.history[editingRoundIdx] || 0;
                  return (
                    <View
                      key={p.id}
                      style={[
                        styles.editHistoryRow,
                        { borderBottomColor: theme.colors.fodinha.divider },
                      ]}
                    >
                      <Text
                        style={{
                          color: theme.colors.text.primary,
                          fontFamily: 'Minecraft',
                          fontSize: ms(12),
                          flex: 1,
                        }}
                      >
                        {p.name}
                      </Text>
                      <View
                        style={[
                          styles.stepperContainer,
                          { backgroundColor: theme.colors.background.overlay },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            game.adjustHistoryDamage(p.id, -1, editingRoundIdx);
                          }}
                          style={styles.stepBtn}
                        >
                          <Ionicons name="remove" size={ms(16)} color={theme.colors.text.white} />
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.mainValue,
                            {
                              color:
                                damage > 0
                                  ? theme.colors.fodinha.damageText
                                  : theme.colors.status.success,
                            },
                          ]}
                        >
                          {damage > 0 ? `-${damage}` : 'OK'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            game.adjustHistoryDamage(p.id, 1, editingRoundIdx);
                          }}
                          style={styles.stepBtn}
                        >
                          <Ionicons name="add" size={ms(16)} color={theme.colors.text.white} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
            <View style={[styles.modalFooterRow, { borderTopColor: theme.colors.fodinha.divider }]}>
              <TouchableOpacity
                onPress={() => {
                  game.deleteRound(editingRoundIdx, () => {
                    setShowEditHistory(false);
                  });
                }}
                style={{ padding: ms(10) }}
              >
                <Text
                  style={{
                    color: theme.colors.status.error,
                    fontFamily: 'Minecraft',
                    fontSize: ms(12),
                    textDecorationLine: 'underline',
                  }}
                >
                  {translate('cacheta.delete_round')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowEditHistory(false);
                }}
                style={[styles.saveBtnSmall, { backgroundColor: theme.colors.brand.primary }]}
              >
                <Text style={{ color: theme.colors.text.white, fontFamily: 'Minecraft' }}>
                  {translate('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FodinhaSettingsModal
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
        initialLives={game.initialLives}
        setInitialLives={game.setInitialLives}
        penaltyMode={game.penaltyMode}
        setPenaltyMode={game.setPenaltyMode}
      />
      <FodinhaHelpModal
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
        onSave={(n) => {
          if (n.trim() && editingPlayerId)
            game.setPlayers((prev) =>
              prev.map((p) => (p.id === editingPlayerId ? { ...p, name: n } : p)),
            );
        }}
        onDelete={handleDeletePlayer}
      />

      {/* TUTORIAL */}
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
          nextText={tutorialStep === 3 ? translate('common.got_it') : translate('common.next')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    height: ms(50),
  },
  headerSide: { flex: 1, flexDirection: 'row' },
  headerTitle: {
    fontFamily: 'Minecraft',
    color: '#FFF',
    fontSize: ms(16),
    textAlign: 'center',
    flex: 2,
  },
  iconBtn: { padding: ms(5) },
  cardsControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(10),
    borderWidth: 1,
    height: ms(30),
  },
  cardsStepBtn: {
    height: '100%',
    paddingHorizontal: ms(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsCenter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(4) },
  badgeText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: ms(10) },
  tableScroll: { paddingHorizontal: ms(20), paddingBottom: ms(20) },
  namesColumn: { width: ms(140) },
  cellHeader: { height: ms(30), justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: ms(10), fontFamily: 'Minecraft', color: '#888' },
  playerCell: {
    height: ms(60),
    paddingHorizontal: ms(10),
    justifyContent: 'center',
    marginBottom: ms(4),
    borderRadius: ms(10),
  },
  playerName: { fontFamily: 'Minecraft', fontSize: ms(11), marginBottom: ms(4) },
  livesContainer: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  playerPoints: { fontSize: ms(14), fontFamily: 'Minecraft' },
  outText: { textDecorationLine: 'line-through', opacity: 0.5 },
  addBtn: { height: ms(40), justifyContent: 'center', alignItems: 'center' },
  historyColumn: { width: ms(40), alignItems: 'center' },
  historyCell: {
    width: ms(34),
    height: ms(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(4),
    borderRadius: ms(6),
  },
  safeDot: { width: ms(8), height: ms(8), borderRadius: ms(4) },
  damageText: { fontFamily: 'Minecraft', fontSize: ms(12) },
  activeColumn: {
    marginLeft: ms(15),
    borderRadius: ms(12),
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'flex-start',
    minWidth: ms(160),
  },
  cellHeaderActive: { height: ms(30), justifyContent: 'center', alignItems: 'center' },
  activeCell: {
    height: ms(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(10),
    marginBottom: ms(4),
    borderBottomWidth: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    borderRadius: ms(8),
    padding: ms(4),
    minWidth: ms(120),
    justifyContent: 'center',
  },
  stepBtn: {
    width: ms(24),
    height: ms(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(4),
  },
  mainValue: { fontFamily: 'Minecraft', fontSize: ms(18), width: ms(50), textAlign: 'center' },
  feedbackContainer: { alignItems: 'flex-end', marginLeft: ms(10) },
  outLabel: { fontFamily: 'Minecraft', fontSize: ms(10) },
  columnFooter: { padding: ms(5), alignItems: 'center' },
  footerInfo: { fontFamily: 'Minecraft', fontSize: ms(10) },
  footer: { height: ms(60), justifyContent: 'center', alignItems: 'center' },
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayContent: { padding: ms(20), borderRadius: ms(20), borderWidth: 1 },
  overlayTitle: { fontFamily: 'Minecraft', fontSize: ms(14), textAlign: 'center' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  editHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(8),
    paddingBottom: ms(8),
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
  saveBtnSmall: { paddingHorizontal: ms(20), paddingVertical: ms(8), borderRadius: ms(8) },
});
