import type { Ref } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getRoundDamage,
  isAlive,
  type FodinhaOutcome,
  type FodinhaPlayer,
  type PenaltyMode,
  type RoundPhase,
} from '../../hooks/useFodinhaGame';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';
import { useTheme } from '../../theme/useTheme';
import type { Theme } from '../../theme/types';
import { TABLE } from './tableMetrics';

interface Props {
  players: readonly FodinhaPlayer[];
  phase: RoundPhase;
  outcome: FodinhaOutcome;
  cardsInRound: number;
  totalBids: number;
  totalWon: number;
  penaltyMode: PenaltyMode;
  onAdjust: (playerId: string, delta: number) => void;
  /** Spotlight do tutorial: a primeira linha editável. */
  firstInputRef?: Ref<View>;
}

/**
 * Painel da rodada, à direita do placar: apostas, resultado ou o placar final.
 *
 * Largura fixa e igual nas duas fases, para o histórico ao lado não pular quando a fase
 * muda.
 */
export const FodinhaRoundPanel = ({
  players,
  phase,
  outcome,
  cardsInRound,
  totalBids,
  totalWon,
  penaltyMode,
  onAdjust,
  firstInputRef,
}: Props) => {
  const { theme } = useTheme();
  const isGameOver = outcome.status !== 'playing';
  const header = getHeader(isGameOver, phase, theme);
  const firstLivingId = players.find(isAlive)?.id;

  const total = phase === 'betting' ? totalBids : totalWon;
  // Apostas não podem fechar com as cartas; vazas têm de fechar.
  const isTotalWrong =
    (phase === 'betting' && totalBids === cardsInRound) ||
    (phase === 'results' && totalWon !== cardsInRound);

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.truco.cardBackground,
          borderColor: theme.colors.fodinha.divider,
        },
      ]}
    >
      <View style={[styles.header, { backgroundColor: header.color }]}>
        <Text style={[styles.headerText, { color: theme.colors.text.black }]}>{header.label}</Text>
      </View>

      {players.map((p) => {
        if (isGameOver) {
          return <FinalRow key={p.id} player={p} outcome={outcome} />;
        }
        if (!isAlive(p)) {
          return (
            <StatusRow
              key={p.id}
              label={translate('fodinha.eliminated')}
              color={theme.colors.fodinha.eliminated}
            />
          );
        }
        return (
          <View
            key={p.id}
            style={[styles.row, { borderBottomColor: theme.colors.fodinha.divider }]}
            ref={p.id === firstLivingId ? firstInputRef : undefined}
            collapsable={false}
          >
            <Stepper player={p} phase={phase} penaltyMode={penaltyMode} onAdjust={onAdjust} />
          </View>
        );
      })}

      {!isGameOver && (
        <View style={[styles.footer, { backgroundColor: theme.colors.background.overlay }]}>
          <Text
            style={[
              styles.footerText,
              { color: isTotalWrong ? theme.colors.status.error : theme.colors.text.white },
            ]}
          >
            {translate('fodinha.total')}: {total}/{cardsInRound}
          </Text>
        </View>
      )}
    </View>
  );
};

const getHeader = (isGameOver: boolean, phase: RoundPhase, theme: Theme) => {
  if (isGameOver) return { label: translate('common.game_over'), color: theme.colors.truco.trophy };
  if (phase === 'betting') {
    return { label: translate('fodinha.bets'), color: theme.colors.status.warning };
  }
  return { label: translate('fodinha.results'), color: theme.colors.neon.primary };
};

interface StepperProps {
  player: FodinhaPlayer;
  phase: RoundPhase;
  penaltyMode: PenaltyMode;
  onAdjust: (playerId: string, delta: number) => void;
}

/**
 * Na aposta mostra a aposta. No resultado mostra "vazas/aposta" — o mesmo "x/y" do
 * TOTAL embaixo — e um selo no canto: ✓ se acertou, "-N" com as vidas que vai perder.
 */
const Stepper = ({ player, phase, penaltyMode, onAdjust }: StepperProps) => {
  const { theme } = useTheme();
  const isResults = phase === 'results';

  return (
    <View style={[styles.stepper, { backgroundColor: theme.colors.background.overlay }]}>
      <StepButton
        icon="remove"
        label={translate('a11y.decrease', { item: player.name })}
        onPress={() => {
          onAdjust(player.id, -1);
        }}
      />
      <View style={styles.valueBox}>
        <Text
          style={[styles.value, { color: theme.colors.text.white }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isResults ? player.currentWon : player.currentBid}
          {isResults && (
            <Text style={[styles.bidSuffix, { color: theme.colors.truco.scoreText }]}>
              /{player.currentBid}
            </Text>
          )}
        </Text>
      </View>
      <StepButton
        icon="add"
        label={translate('a11y.increase', { item: player.name })}
        onPress={() => {
          onAdjust(player.id, 1);
        }}
      />
      {isResults && (
        <ResultBadge damage={getRoundDamage(player.currentBid, player.currentWon, penaltyMode)} />
      )}
    </View>
  );
};

interface StepButtonProps {
  icon: 'add' | 'remove';
  /** O ícone sozinho não diz a um leitor de tela de quem é o valor. */
  label: string;
  onPress: () => void;
}

const StepButton = ({ icon, label, onPress }: StepButtonProps) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.stepButton, { backgroundColor: theme.colors.fodinha.divider }]}
    >
      <Ionicons name={icon} size={ms(16)} color={theme.colors.text.white} />
    </TouchableOpacity>
  );
};

/** Fica por cima do canto do stepper sem roubar o toque do "+". */
const ResultBadge = ({ damage }: { damage: number }) => {
  const { theme } = useTheme();
  const isHit = damage === 0;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.badge,
        {
          backgroundColor: isHit ? theme.colors.status.success : theme.colors.fodinha.damageText,
        },
      ]}
    >
      {isHit ? (
        <Ionicons name="checkmark" size={ms(10)} color={theme.colors.text.white} />
      ) : (
        <Text style={[styles.badgeText, { color: theme.colors.text.white }]}>-{damage}</Text>
      )}
    </View>
  );
};

const StatusRow = ({ label, color, icon }: { label: string; color: string; icon?: 'trophy' }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[styles.row, styles.statusRow, { borderBottomColor: theme.colors.fodinha.divider }]}
    >
      {icon && <Ionicons name={icon} size={ms(14)} color={color} />}
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
};

/** Placar final: troféu para quem venceu, empate para quem caiu junto na última. */
const FinalRow = ({ player, outcome }: { player: FodinhaPlayer; outcome: FodinhaOutcome }) => {
  const { theme } = useTheme();

  if (outcome.status === 'won' && outcome.winner.id === player.id) {
    return (
      <StatusRow
        label={translate('fodinha.winner')}
        color={theme.colors.truco.trophy}
        icon="trophy"
      />
    );
  }
  if (outcome.status === 'tie' && outcome.players.some((p) => p.id === player.id)) {
    return <StatusRow label={translate('fodinha.tie')} color={theme.colors.status.warning} />;
  }
  return (
    <StatusRow label={translate('fodinha.eliminated')} color={theme.colors.fodinha.eliminated} />
  );
};

const styles = StyleSheet.create({
  panel: {
    width: TABLE.panelWidth,
    marginLeft: TABLE.panelGap,
    borderRadius: ms(12),
    overflow: 'hidden',
    borderWidth: TABLE.panelBorderWidth,
    // Sem isto a linha esticaria o painel até a altura da coluna de nomes.
    alignSelf: 'flex-start',
  },
  header: { height: TABLE.headerHeight, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: ms(10), fontFamily: 'Minecraft', fontWeight: 'bold' },
  row: {
    height: TABLE.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(10),
    marginBottom: TABLE.rowGap,
    borderBottomWidth: 1,
  },
  statusRow: { gap: ms(6) },
  statusText: { fontFamily: 'Minecraft', fontSize: ms(10) },
  stepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    borderRadius: ms(8),
    padding: ms(4),
  },
  stepButton: {
    width: ms(24),
    height: ms(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(4),
  },
  valueBox: { flex: 1, alignItems: 'center' },
  value: { fontFamily: 'Minecraft', fontSize: ms(18), textAlign: 'center' },
  bidSuffix: { fontFamily: 'Minecraft', fontSize: ms(9) },
  badge: {
    position: 'absolute',
    top: -ms(6),
    right: -ms(6),
    minWidth: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    paddingHorizontal: ms(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontFamily: 'Minecraft', fontSize: ms(7) },
  footer: { padding: ms(5), alignItems: 'center' },
  footerText: { fontFamily: 'Minecraft', fontSize: ms(10) },
});
