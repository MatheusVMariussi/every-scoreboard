import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ms } from '../../theme/responsive';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Nome do grupo, para o leitor de tela. */
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Escolha única entre poucas opções curtas, numa pastilha. A escolhida fica em dourado,
 * a mesma cor dos valores dos contadores: dourado é "o que está valendo".
 */
export const SegmentedControl = <T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => {
  const { theme } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.truco.cardBackground,
          borderColor: theme.colors.truco.divider,
        },
      ]}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              onChange(option.value);
            }}
            style={[styles.segment, isActive && { backgroundColor: theme.colors.truco.scoreText }]}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: isActive }}
          >
            <Text
              style={[
                styles.text,
                isActive
                  ? { color: theme.colors.text.black }
                  : { ...styles.inactiveText, color: theme.colors.text.secondary },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: ms(36),
    padding: ms(3),
    borderRadius: ms(18),
    borderWidth: 1,
  },
  segment: { justifyContent: 'center', paddingHorizontal: ms(12), borderRadius: ms(15) },
  text: { fontFamily: 'Minecraft', fontSize: ms(10) },
  inactiveText: { opacity: 0.6 },
});
