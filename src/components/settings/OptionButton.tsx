import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ms } from '../../theme/responsive';

interface OptionButtonProps {
  label: string;
  /** Linha de explicação abaixo do rótulo. */
  subLabel?: string;
  active: boolean;
  onPress: () => void;
  /** Versão menor, para os modais em paisagem. */
  compact?: boolean;
}

/** Uma das opções de um grupo de escolha única nas configurações de jogo. */
export const OptionButton = ({
  label,
  subLabel,
  active,
  onPress,
  compact = false,
}: OptionButtonProps) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: active ? theme.colors.brand.primary : 'transparent',
          borderColor: active ? theme.colors.brand.primary : theme.colors.text.secondary,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: active ? theme.colors.text.white : theme.colors.text.secondary },
        ]}
      >
        {label}
      </Text>
      {subLabel !== undefined && (
        <Text
          style={[
            styles.subLabel,
            { color: active ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary },
          ]}
        >
          {subLabel}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: ms(12),
    borderRadius: ms(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonCompact: { paddingVertical: ms(8), paddingHorizontal: ms(5) },
  label: { fontFamily: 'Minecraft', fontSize: ms(12) },
  labelCompact: { fontSize: ms(11), marginBottom: ms(2) },
  subLabel: { fontSize: ms(7), fontFamily: 'Minecraft', opacity: 0.6 },
});
