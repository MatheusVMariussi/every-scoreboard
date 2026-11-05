import { useState, useLayoutEffect, useRef } from 'react';
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
import { translate } from '../i18n';
import { GameButton } from '../components/GameButton';
import { useTransitionBack } from '../hooks/useTransitionBack';
import { STORAGE_KEYS } from '../utils/storage';
import { EditNameModal } from '../components/EditNameModal';
import { EditRoundOverlay } from '../components/EditRoundOverlay';
import { CachetaSettingsModal } from '../components/CachetaSettingsModal';
import { CachetaHelpModal } from '../components/CachetaHelpModal';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useTutorialTarget } from '../hooks/useTutorialTarget';
import { useGameTutorial } from '../hooks/useGameTutorial';
import { useCachetaGame } from '../hooks/useCachetaGame';
import { ms, wp } from '../theme/responsive';
import { getVoiceLocale, VoiceFooter, VoicePanel } from '../components/voice/VoiceFooter';
import { useVoiceScoring } from '../voice/useVoiceScoring';
import { toCachetaBatch, type PendingState } from '../voice/pendingQueue';

type Action = 'won' | 'fold' | 'lost' | null;
type PlayableAction = Exclude<Action, null>;

/** Ordem dos botões na linha de cada jogador. */
const PLAYABLE_ACTIONS: readonly PlayableAction[] = ['fold', 'lost', 'won'];

const TUTORIAL_MESSAGE_KEYS = [
  'cacheta.tutorial.step_names',
  'cacheta.tutorial.step_actions',
  'cacheta.tutorial.step_button',
];
/** Dá tempo da rotação para paisagem assentar antes de medir os alvos do spotlight. */
const TUTORIAL_START_DELAY_MS = 500;

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

  const tutorial = useGameTutorial({
    storageKey: STORAGE_KEYS.TUTORIAL_CACHETA,
    stepCount: TUTORIAL_MESSAGE_KEYS.length,
    // Paisagem assentada e tabela (alvo dos passos) já desenhada com o save.
    isReady: layoutReady && game.isLoaded,
    startDelayMs: TUTORIAL_START_DELAY_MS,
  });
  const targetNames = useTutorialTarget(tutorial.isStepActive(0));
  const targetActions = useTutorialTarget(tutorial.isStepActive(1));
  const targetButton = useTutorialTarget(tutorial.isStepActive(2));
  const tutorialTargets = [targetNames, targetActions, targetButton];

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
              accessibilityRole="button"
              accessibilityLabel={translate('a11y.back')}
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
              accessibilityRole="button"
              accessibilityLabel={translate('a11y.settings')}
            >
              <Ionicons name="settings-sharp" size={ms(24)} color={theme.colors.text.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Espera o save: antes dele a tabela seria a padrão, com 3 jogadores zerados. */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {game.isLoaded && (
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
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={game.handleAddPlayer}
                  accessibilityRole="button"
                  accessibilityLabel={translate('a11y.add_player')}
                >
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
                      accessibilityRole="button"
                      accessibilityLabel={translate('common.edit_round', {
                        index: round.index + 1,
                      })}
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
                        {PLAYABLE_ACTIONS.map((action) => (
                          <ActionCircle
                            key={action}
                            action={action}
                            active={p.currentAction === action}
                            onPress={() => {
                              game.updateAction(p.id, action);
                            }}
                          />
                        ))}
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
          )}
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
        <EditRoundOverlay
          roundIndex={editingRoundIdx}
          width={wp('85%')}
          onClose={handleSaveHistory}
          onDelete={() => {
            game.deleteRound(editingRoundIdx, () => {
              setShowEditHistory(false);
            });
          }}
        >
          {game.players.map((p) => (
            <View
              key={p.id}
              style={[styles.editHistoryRow, { borderBottomColor: theme.colors.modal.divider }]}
            >
              <Text style={[styles.editHistoryName, { color: theme.colors.text.primary }]}>
                {p.name}
              </Text>
              <View style={styles.actionRow}>
                {PLAYABLE_ACTIONS.map((action) => (
                  <ActionCircle
                    key={action}
                    action={action}
                    active={p.history[editingRoundIdx] === action}
                    onPress={() => {
                      game.updateHistoryAction(p.id, action, editingRoundIdx);
                    }}
                  />
                ))}
              </View>
            </View>
          ))}
        </EditRoundOverlay>
      )}

      <CachetaSettingsModal
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

/** Chave da cor de cada ação em `theme.colors.cacheta`. */
const ACTION_COLOR_KEY = { fold: 'fold', lost: 'loss', won: 'win' } as const;

interface ActionCircleProps {
  action: PlayableAction;
  active: boolean;
  onPress: () => void;
}

const ActionCircle = ({ action, active, onPress }: ActionCircleProps) => {
  const { theme } = useTheme();
  const color = theme.colors.cacheta[ACTION_COLOR_KEY[action]];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.circle,
        { borderColor: color, backgroundColor: active ? color : 'transparent' },
      ]}
      // A letra sozinha ("C", "P", "G") não diz nada a um leitor de tela.
      accessibilityRole="button"
      accessibilityLabel={translate(`cacheta.help.${action}_title`)}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.circleText, { color: active ? theme.colors.text.black : color }]}>
        {translate(`cacheta.actions.${action}`)}
      </Text>
    </TouchableOpacity>
  );
};

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
  editHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(10),
    paddingBottom: ms(10),
    borderBottomWidth: 1,
  },
  editHistoryName: { fontFamily: 'Minecraft', fontSize: ms(10), flex: 1 },
});
