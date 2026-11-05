import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';
import { SettingsModalShell } from './settings/SettingsModalShell';
import { MAX_INITIAL_POINTS, MIN_INITIAL_POINTS } from '../hooks/useCachetaGame';

interface CachetaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
  initialPoints: number;
  setInitialPoints: (points: number) => void;
}

export const CachetaSettingsModal = ({
  visible,
  onClose,
  onReset,
  onOpenHelp,
  initialPoints,
  setInitialPoints,
}: CachetaSettingsModalProps) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const pointsLabel = translate('cacheta.initial_points');
  const counterBtnStyle = [
    styles.counterBtn,
    { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay },
  ];

  const adjustPoints = (amount: number) => {
    setInitialPoints(
      Math.max(MIN_INITIAL_POINTS, Math.min(MAX_INITIAL_POINTS, initialPoints + amount)),
    );
  };

  return (
    <SettingsModalShell
      visible={visible}
      onClose={onClose}
      title={translate('settings.title')}
      onOpenHelp={onOpenHelp}
      onReset={onReset}
      width={width * 0.45}
    >
      {/* Controle de Pontos Iniciais */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{pointsLabel}</Text>

        <View style={styles.counterRow}>
          <TouchableOpacity
            onPress={() => {
              adjustPoints(-1);
            }}
            style={counterBtnStyle}
            accessibilityRole="button"
            accessibilityLabel={translate('a11y.decrease', { item: pointsLabel })}
          >
            <Ionicons name="remove" size={ms(24)} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <Text style={[styles.pointsValue, { color: theme.colors.truco.scoreText }]}>
            {initialPoints}
          </Text>

          <TouchableOpacity
            onPress={() => {
              adjustPoints(1);
            }}
            style={counterBtnStyle}
            accessibilityRole="button"
            accessibilityLabel={translate('a11y.increase', { item: pointsLabel })}
          >
            <Ionicons name="add" size={ms(24)} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SettingsModalShell>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: ms(20), alignItems: 'center' },
  label: { fontSize: ms(12), fontFamily: 'Minecraft', marginBottom: ms(10), opacity: 0.8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: ms(20) },
  counterBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsValue: { fontFamily: 'Minecraft', fontSize: ms(32) },
});
