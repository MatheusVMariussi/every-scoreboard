import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';
import { MAX_DECKS, MIN_DECKS } from '../hooks/useFodinhaGame';

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                {
                  width: width * 0.65,
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.truco.scoreText,
                },
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                  {translate('fodinha.settings_title')}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

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
              <View style={[styles.section, { marginBottom: ms(5) }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  {translate('fodinha.penalty_mode')}
                </Text>
                <View style={styles.row}>
                  <OptionBtn
                    label={translate('fodinha.fixed')}
                    subLabel={translate('fodinha.fixed_desc')}
                    active={penaltyMode === 'fixed'}
                    onPress={() => {
                      setPenaltyMode('fixed');
                    }}
                    theme={theme}
                  />
                  <OptionBtn
                    label={translate('fodinha.difference')}
                    subLabel={translate('fodinha.difference_desc')}
                    active={penaltyMode === 'difference'}
                    onPress={() => {
                      setPenaltyMode('difference');
                    }}
                    theme={theme}
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { borderColor: theme.colors.text.secondary, borderWidth: 1 },
                  ]}
                  onPress={onOpenHelp}
                >
                  <Ionicons
                    name="book-outline"
                    size={ms(20)}
                    color={theme.colors.text.primary}
                    style={{ marginRight: ms(8) }}
                  />
                  <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                    {translate('common.how_to_play')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.status.error }]}
                  onPress={() => {
                    onReset();
                    onClose();
                  }}
                >
                  <Text style={[styles.actionText, { color: theme.colors.text.white }]}>
                    {translate('common.reset_match').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
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

const OptionBtn = ({ label, subLabel, active, onPress, theme }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.optBtn,
      {
        backgroundColor: active ? theme.colors.brand.primary : 'transparent',
        borderColor: active ? theme.colors.brand.primary : theme.colors.text.secondary,
      },
    ]}
  >
    <Text
      style={[
        styles.optText,
        { color: active ? theme.colors.text.white : theme.colors.text.secondary },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.optSubText,
        { color: active ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary },
      ]}
    >
      {subLabel}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: ms(20), borderRadius: ms(20), borderWidth: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(15),
  },
  title: { fontFamily: 'Minecraft', fontSize: ms(14) },
  section: { marginBottom: ms(15), alignItems: 'center', width: '100%' },
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
  optBtn: {
    flex: 1,
    paddingVertical: ms(8),
    paddingHorizontal: ms(5),
    borderRadius: ms(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  optText: { fontFamily: 'Minecraft', fontSize: ms(11), marginBottom: ms(2) },
  optSubText: { fontSize: ms(7), fontFamily: 'Minecraft', opacity: 0.6 },
  divider: { height: 1, marginBottom: 0, marginTop: ms(10), width: '100%' },
  actionsRow: { flexDirection: 'row', gap: ms(15) },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    padding: ms(10),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontFamily: 'Minecraft', fontSize: ms(12) },
});
