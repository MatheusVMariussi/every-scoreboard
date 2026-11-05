import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';

interface StepperProps {
  /** O que o valor conta, para o leitor de tela ("VIDAS INICIAIS, 7"). */
  label: string;
  value: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
}

/** A pastilha é baixa para caber na paisagem; o hitSlop devolve a altura do toque. */
const HIT_SLOP = { top: ms(6), bottom: ms(6) };

const ACCESSIBILITY_ACTIONS: AccessibilityActionInfo[] = [
  { name: 'increment' },
  { name: 'decrement' },
];

/** − valor + numa pastilha só, com o valor em dourado como os outros números da mesa. */
export const Stepper = ({ label, value, canDecrease, canIncrease, onChange }: StepperProps) => {
  const { theme } = useTheme();

  // Para o leitor de tela a pastilha é um controle só, que diz o nome e o valor juntos e
  // sobe ou desce com o gesto de ajuste — como o placar do Truco.
  const handleAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    if (nativeEvent.actionName === 'increment' && canIncrease) onChange(1);
    else if (nativeEvent.actionName === 'decrement' && canDecrease) onChange(-1);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: String(value) }}
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={handleAccessibilityAction}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.truco.cardBackground,
          borderColor: theme.colors.truco.divider,
        },
      ]}
    >
      <StepButton
        icon="remove"
        enabled={canDecrease}
        accessibilityLabel={translate('a11y.decrease', { item: label })}
        onPress={() => {
          onChange(-1);
        }}
      />
      <Text style={[styles.value, { color: theme.colors.truco.scoreText }]}>{value}</Text>
      <StepButton
        icon="add"
        enabled={canIncrease}
        accessibilityLabel={translate('a11y.increase', { item: label })}
        onPress={() => {
          onChange(1);
        }}
      />
    </View>
  );
};

interface StepButtonProps {
  icon: 'add' | 'remove';
  enabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}

const StepButton = ({ icon, enabled, accessibilityLabel, onPress }: StepButtonProps) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!enabled}
      hitSlop={HIT_SLOP}
      style={[styles.button, !enabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !enabled }}
    >
      <Ionicons name={icon} size={ms(18)} color={theme.colors.text.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(36),
    borderRadius: ms(18),
    borderWidth: 1,
  },
  button: { width: ms(40), height: '100%', justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.3 },
  // Largura fixa: o valor indo de 9 para 10 não empurra os botões.
  value: { fontFamily: 'Minecraft', fontSize: ms(16), minWidth: ms(36), textAlign: 'center' },
});
