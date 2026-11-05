import { useState, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/types';
import { translate } from '../i18n';
import { GameButton } from '../components/GameButton';
import { useTransitionBack } from '../hooks/useTransitionBack';
import { STORAGE_KEYS } from '../utils/storage';
import { EditNameModal } from '../components/EditNameModal';
import { EditRoundOverlay } from '../components/EditRoundOverlay';
import { FodinhaSettingsModal } from '../components/FodinhaSettingsModal';
import { FodinhaHelpModal } from '../components/FodinhaHelpModal';
import { FodinhaGameOverModal } from '../components/fodinha/FodinhaGameOverModal';
import { FodinhaHistoryGrid } from '../components/fodinha/FodinhaHistoryGrid';
import { FodinhaRoundPanel } from '../components/fodinha/FodinhaRoundPanel';
import { TABLE } from '../components/fodinha/tableMetrics';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useTutorialTarget } from '../hooks/useTutorialTarget';
import { useGameTutorial } from '../hooks/useGameTutorial';
import { orderForTable, useFodinhaGame } from '../hooks/useFodinhaGame';
import { ms, wp } from '../theme/responsive';
import { getVoiceLocale, VoiceFooter, VoicePanel } from '../components/voice/VoiceFooter';
import { useVoiceScoring } from '../voice/useVoiceScoring';
import { toFodinhaBatch, type PendingState } from '../voice/pendingQueue';

const TUTORIAL_MESSAGE_KEYS = [
  'fodinha.tutorial.step_cards',
  'fodinha.tutorial.step_lives',
  'fodinha.tutorial.step_inputs',
  'fodinha.tutorial.step_button',
];
/** Dá tempo da rotação para paisagem assentar antes de medir os alvos do spotlight. */
const TUTORIAL_START_DELAY_MS = 500;

export const FodinhaScreen = () => {
  useTransitionBack();

  const { theme } = useTheme();
  const navigation = useNavigation();

  const game = useFodinhaGame();
  // Eliminados descem na tabela; a voz continua usando a ordem das cadeiras (`game.players`).
  const tablePlayers = useMemo(() => orderForTable(game.players), [game.players]);

  const [showEditName, setShowEditName] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);

  const [layoutReady, setLayoutReady] = useState(false);

  const voice = useVoiceScoring({
    game: 'fodinha',
    // Fixado na montagem: a gramática e o reconhecedor seguem o idioma do app.
    locale: getVoiceLocale(),
    // A mesa inteira, não só os vivos: "jogador dois" continua sendo a cadeira 2 depois
    // de uma eliminação. O que for dito para um eliminado a lógica do jogo ignora.
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

  // Fim de jogo: o microfone some da tela, então não pode ficar ligado nem com fila.
  const { mode: voiceMode, count: voiceCount, stopContinuous, clear: clearVoice } = voice;
  useEffect(() => {
    if (!game.isGameOver) return;
    if (voiceMode !== 'idle') stopContinuous();
    if (voiceCount > 0) clearVoice();
  }, [game.isGameOver, voiceMode, voiceCount, stopContinuous, clearVoice]);

  const tutorial = useGameTutorial({
    storageKey: STORAGE_KEYS.TUTORIAL_FODINHA,
    stepCount: TUTORIAL_MESSAGE_KEYS.length,
    // Paisagem assentada e tabela (alvo dos passos) já desenhada com o save.
    isReady: layoutReady && game.isLoaded,
    startDelayMs: TUTORIAL_START_DELAY_MS,
  });
  const targetCards = useTutorialTarget(tutorial.isStepActive(0));
  const targetLives = useTutorialTarget(tutorial.isStepActive(1));
  const targetInputs = useTutorialTarget(tutorial.isStepActive(2));
  const targetButton = useTutorialTarget(tutorial.isStepActive(3));
  const tutorialTargets = [targetCards, targetLives, targetInputs, targetButton];

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > height) {
      setLayoutReady(true);
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

  // Estável para o `memo` do histórico: os setters do React não mudam de identidade.
  const handlePressRound = useCallback((roundIndex: number) => {
    setEditingRoundIdx(roundIndex);
    setShowEditHistory(true);
  }, []);

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

  const isCardsLocked = game.roundPhase !== 'betting' || game.isGameOver;
  const canAddCard = !isCardsLocked && game.cardsInRound < game.maxCards;
  const canRemoveCard = !isCardsLocked && game.cardsInRound > 1;

  const footerAction = game.isGameOver
    ? {
        title: translate('common.new_match'),
        onPress: game.handleReset,
        variant: 'primary' as const,
      }
    : {
        title:
          game.roundPhase === 'betting'
            ? translate('fodinha.confirm_bets')
            : translate('fodinha.finish_round'),
        onPress: game.handlePhaseChange,
        variant: game.roundPhase === 'betting' ? ('secondary' as const) : ('primary' as const),
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
              accessibilityRole="button"
              accessibilityLabel={translate('a11y.back')}
            >
              <Ionicons name="arrow-back" size={ms(24)} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>{translate('fodinha.title')}</Text>

          <View style={[styles.headerSide, { justifyContent: 'flex-end', gap: ms(10) }]}>
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
                onPress={game.decreaseCards}
                style={styles.cardsStepBtn}
                disabled={!canRemoveCard}
                accessibilityRole="button"
                accessibilityLabel={translate('a11y.decrease', {
                  item: translate('fodinha.cards'),
                })}
              >
                <Ionicons
                  name="remove"
                  size={ms(14)}
                  color={canRemoveCard ? theme.colors.text.white : theme.colors.fodinha.muted}
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
                  {/* Depois do fim não existe próxima rodada para mostrar. */}
                  {game.isGameOver ? '-' : game.cardsInRound} {translate('fodinha.cards')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={game.increaseCards}
                style={styles.cardsStepBtn}
                disabled={!canAddCard}
                accessibilityRole="button"
                accessibilityLabel={translate('a11y.increase', {
                  item: translate('fodinha.cards'),
                })}
              >
                <Ionicons
                  name="add"
                  size={ms(14)}
                  color={canAddCard ? theme.colors.text.white : theme.colors.fodinha.muted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setSettingsVisible(true);
              }}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={translate('a11y.settings')}
            >
              <Ionicons name="settings-sharp" size={ms(24)} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/*
         * Placar em três partes numa linha: nomes fixos à esquerda, histórico com rolagem
         * própria no meio e o painel da rodada fixo à direita. Só o histórico rola para o
         * lado; a rolagem vertical leva as três juntas.
         *
         * Espera o save carregar: antes disso a tabela seria a padrão, e o histórico
         * rolaria animado do vazio até a última rodada.
         */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.tableContent}
          showsVerticalScrollIndicator={false}
        >
          {game.isLoaded && (
            <View style={styles.tableRow}>
              {/* COLUNA NOMES */}
              <View style={styles.namesColumn} ref={targetLives.ref} collapsable={false}>
                <View style={styles.cellHeader}>
                  <Text style={styles.headerText}>{translate('common.player').toUpperCase()}</Text>
                </View>
                {tablePlayers.map((p) => (
                  <TouchableOpacity
                    key={p.id}
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
                ))}
                {/* Entrar alguém depois do fim reabriria o jogo sem querer. */}
                {!game.isGameOver && (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={game.handleAddPlayer}
                    accessibilityRole="button"
                    accessibilityLabel={translate('a11y.add_player')}
                  >
                    <Ionicons name="add-circle" size={ms(26)} color={theme.colors.neon.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* HISTÓRICO */}
              <FodinhaHistoryGrid
                players={tablePlayers}
                rounds={game.rounds}
                onPressRound={handlePressRound}
              />

              {/* PAINEL DA RODADA */}
              <FodinhaRoundPanel
                players={tablePlayers}
                phase={game.roundPhase}
                outcome={game.outcome}
                cardsInRound={game.cardsInRound}
                totalBids={game.totalBids}
                totalWon={game.totalWon}
                penaltyMode={game.penaltyMode}
                onAdjust={game.adjustValue}
                firstInputRef={targetInputs.ref}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer} ref={targetButton.ref} collapsable={false}>
          {!game.isGameOver && <VoiceFooter voice={voice} players={game.players} />}
          <View style={{ width: ms(250), height: ms(50) }}>
            <GameButton
              title={footerAction.title}
              onPress={footerAction.onPress}
              variant={footerAction.variant}
              disabled={!game.isGameOver && !canAdvancePhase}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* OVERLAY: EDITAR HISTÓRICO */}
      {showEditHistory && editingRoundIdx !== null && (
        <EditRoundOverlay
          roundIndex={editingRoundIdx}
          width={wp('50%')}
          onClose={() => {
            setShowEditHistory(false);
          }}
          onDelete={() => {
            game.deleteRound(editingRoundIdx, () => {
              setShowEditHistory(false);
            });
          }}
        >
          {tablePlayers.map((p) => {
            const damage = p.history[editingRoundIdx];
            // Não jogou a rodada (já estava fora ou entrou depois): nada a ajustar.
            const didPlay = typeof damage === 'number';
            return (
              <View
                key={p.id}
                style={[styles.editHistoryRow, { borderBottomColor: theme.colors.fodinha.divider }]}
              >
                <Text style={[styles.editHistoryName, { color: theme.colors.text.primary }]}>
                  {p.name}
                </Text>
                <View
                  style={[
                    styles.stepperContainer,
                    { backgroundColor: theme.colors.background.overlay },
                    !didPlay && styles.stepperDisabled,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      game.adjustHistoryDamage(p.id, -1, editingRoundIdx);
                    }}
                    style={styles.stepBtn}
                    disabled={!didPlay}
                    accessibilityRole="button"
                    accessibilityLabel={translate('a11y.decrease', { item: p.name })}
                  >
                    <Ionicons name="remove" size={ms(16)} color={theme.colors.text.white} />
                  </TouchableOpacity>
                  <Text style={[styles.mainValue, { color: getHistoryValueColor(damage, theme) }]}>
                    {getHistoryValueLabel(damage)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      game.adjustHistoryDamage(p.id, 1, editingRoundIdx);
                    }}
                    style={styles.stepBtn}
                    disabled={!didPlay}
                    accessibilityRole="button"
                    accessibilityLabel={translate('a11y.increase', { item: p.name })}
                  >
                    <Ionicons name="add" size={ms(16)} color={theme.colors.text.white} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </EditRoundOverlay>
      )}

      <FodinhaSettingsModal
        visible={settingsVisible}
        onClose={() => {
          setSettingsVisible(false);
        }}
        onReset={() => {
          game.handleReset();
          if (tutorial.isActive) tutorial.next();
        }}
        onOpenHelp={() => {
          setSettingsVisible(false);
          setHelpVisible(true);
        }}
        initialLives={game.initialLives}
        setInitialLives={game.setInitialLives}
        penaltyMode={game.penaltyMode}
        setPenaltyMode={game.setPenaltyMode}
        deckCount={game.deckCount}
        setDeckCount={game.setDeckCount}
        maxCards={game.maxCards}
        livingCount={game.livingPlayers.length}
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
        // Depois do fim o placar está fechado: tirar alguém mudaria quem venceu.
        onDelete={game.isGameOver ? undefined : handleDeletePlayer}
      />
      <FodinhaGameOverModal
        visible={game.gameOverVisible && game.isGameOver}
        outcome={game.outcome}
        onViewBoard={game.dismissGameOver}
        onNewMatch={game.handleReset}
      />

      {/* Painel da fila: na raiz, senão o Android não entrega toque fora do rodapé. */}
      {!game.isGameOver && <VoicePanel voice={voice} players={game.players} />}

      {/* TUTORIAL */}
      {layoutReady && (
        <TutorialOverlay
          visible={tutorial.isActive}
          spotlight={tutorialTargets[tutorial.step].layout}
          message={translate(TUTORIAL_MESSAGE_KEYS[tutorial.step])}
          onNext={tutorial.next}
          nextText={tutorial.isLastStep ? translate('common.got_it') : translate('common.next')}
        />
      )}
    </View>
  );
};

const getHistoryValueLabel = (damage: number | null | undefined): string => {
  if (typeof damage !== 'number') return '-';
  return damage > 0 ? `-${String(damage)}` : 'OK';
};

const getHistoryValueColor = (damage: number | null | undefined, theme: Theme): string => {
  if (typeof damage !== 'number') return theme.colors.fodinha.muted;
  return damage > 0 ? theme.colors.fodinha.damageText : theme.colors.status.success;
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
  tableContent: { paddingHorizontal: ms(20), paddingBottom: ms(20) },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start' },
  namesColumn: { width: ms(140), flexShrink: 0, paddingTop: TABLE.panelBorderWidth },
  cellHeader: { height: TABLE.headerHeight, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: ms(10), fontFamily: 'Minecraft', color: '#888' },
  playerCell: {
    height: TABLE.rowHeight,
    paddingHorizontal: ms(10),
    justifyContent: 'center',
    marginBottom: TABLE.rowGap,
    borderRadius: ms(10),
  },
  playerName: { fontFamily: 'Minecraft', fontSize: ms(11), marginBottom: ms(4) },
  livesContainer: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  playerPoints: { fontSize: ms(14), fontFamily: 'Minecraft' },
  outText: { textDecorationLine: 'line-through', opacity: 0.5 },
  addBtn: { height: ms(40), justifyContent: 'center', alignItems: 'center' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    borderRadius: ms(8),
    padding: ms(4),
    minWidth: ms(120),
    justifyContent: 'center',
  },
  stepperDisabled: { opacity: 0.4 },
  stepBtn: {
    width: ms(24),
    height: ms(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(4),
  },
  mainValue: { fontFamily: 'Minecraft', fontSize: ms(18), width: ms(50), textAlign: 'center' },
  footer: { height: ms(60), justifyContent: 'center', alignItems: 'center' },
  editHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(8),
    paddingBottom: ms(8),
    borderBottomWidth: 1,
  },
  editHistoryName: { fontFamily: 'Minecraft', fontSize: ms(12), flex: 1 },
});
