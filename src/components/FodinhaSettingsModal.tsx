import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';
import { MAX_DECKS, MIN_DECKS } from '../hooks/useFodinhaGame';
import { SettingsModalShell } from './settings/SettingsModalShell';
import { OptionButton } from './settings/OptionButton';

const MIN_LIVES = 1;
const MAX_LIVES = 50;

interface FodinhaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
  initialLives: number;
  setInitialLives: (lives: number) => void;
  penaltyMode: 'fixed' | 'difference';
  setPenaltyMode: (mode: 'fixed' | 'difference') => void;
  deckCount: number;
  setDeckCount: (count: number) => void;
  /** Limite de cartas por jogador com os baralhos e os vivos de agora. */
  maxCards: number;
  livingCount: number;
}

export const FodinhaSettingsModal = ({
  visible,
  onClose,
  onReset,
  onOpenHelp,
  initialLives,
  setInitialLives,
  penaltyMode,
  setPenaltyMode,
  deckCount,
  setDeckCount,
  maxCards,
  livingCount,
}: FodinhaSettingsModalProps) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const adjustLives = (amount: number) => {
    setInitialLives(Math.max(MIN_LIVES, Math.min(MAX_LIVES, initialLives + amount)));
  };

  return (
    <SettingsModalShell
      visible={visible}
      onClose={onClose}
      title={translate('fodinha.settings_title')}
      onOpenHelp={onOpenHelp}
      onReset={onReset}
      width={width * 0.65}
      compact
    >
      {/* VIDAS E BARALHOS: lado a lado, o modal já é alto para a paisagem */}
      <View style={styles.countersRow}>
        <Counter
          label={translate('fodinha.initial_lives')}
          value={initialLives}
          canDecrease={initialLives > MIN_LIVES}
          canIncrease={initialLives < MAX_LIVES}
          onChange={adjustLives}
        />
        <Counter
          label={translate('fodinha.decks')}
          value={deckCount}
          canDecrease={deckCount > MIN_DECKS}
          canIncrease={deckCount < MAX_DECKS}
          onChange={(delta) => {
            setDeckCount(deckCount + delta);
          }}
          hint={translate('fodinha.max_cards_hint', {
            players: livingCount,
            max: maxCards,
          })}
        />
      </View>

      {/* MODO DE PUNIÇÃO */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          {translate('fodinha.penalty_mode')}
        </Text>
        <View style={styles.row}>
          <OptionButton
            label={translate('fodinha.fixed')}
            subLabel={translate('fodinha.fixed_desc')}
            active={penaltyMode === 'fixed'}
            onPress={() => {
              setPenaltyMode('fixed');
            }}
            compact
          />
          <OptionButton
            label={translate('fodinha.difference')}
            subLabel={translate('fodinha.difference_desc')}
            active={penaltyMode === 'difference'}
            onPress={() => {
              setPenaltyMode('difference');
            }}
            compact
          />
        </View>
      </View>
    </SettingsModalShell>
  );
};

interface CounterProps {
  label: string;
  value: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
  hint?: string;
}

const Counter = ({ label, value, canDecrease, canIncrease, onChange, hint }: CounterProps) => {
  const { theme } = useTheme();
  const buttonStyle = [
    styles.counterBtn,
    { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay },
  ];

  return (
    <View style={styles.counter}>
      <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{label}</Text>
      <View style={styles.counterRow}>
        <TouchableOpacity
          onPress={() => {
            onChange(-1);
          }}
          disabled={!canDecrease}
          style={[buttonStyle, !canDecrease && styles.counterBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={translate('a11y.decrease', { item: label })}
        >
          <Ionicons name="remove" size={ms(24)} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.pointsValue, { color: theme.colors.truco.scoreText }]}>{value}</Text>
        <TouchableOpacity
          onPress={() => {
            onChange(1);
          }}
          disabled={!canIncrease}
          style={[buttonStyle, !canIncrease && styles.counterBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={translate('a11y.increase', { item: label })}
        >
          <Ionicons name="add" size={ms(24)} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
      {hint !== undefined && (
        <Text style={[styles.hint, { color: theme.colors.text.secondary }]}>{hint}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: ms(5), alignItems: 'center', width: '100%' },
  countersRow: { flexDirection: 'row', marginBottom: ms(15), width: '100%' },
  counter: { flex: 1, alignItems: 'center' },
  counterBtnDisabled: { opacity: 0.3 },
  hint: {
    fontSize: ms(7),
    fontFamily: 'Minecraft',
    marginTop: ms(6),
    opacity: 0.6,
    textAlign: 'center',
  },
  label: { fontSize: ms(10), fontFamily: 'Minecraft', marginBottom: ms(5), opacity: 0.8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: ms(16) },
  counterBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsValue: { fontFamily: 'Minecraft', fontSize: ms(28) },
  row: { flexDirection: 'row', gap: ms(10), width: '100%' },
});
