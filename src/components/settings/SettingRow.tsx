import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ms } from '../../theme/responsive';

interface SettingRowProps {
  label: string;
  /** Linha de apoio abaixo do rótulo: o efeito do valor escolhido agora. */
  description?: string;
  /** Traço acima da linha, para separá-la da anterior. */
  divided?: boolean;
  /** O controle, alinhado à direita. */
  children: ReactNode;
}

/**
 * Uma opção de jogo: o que ela é à esquerda, o controle à direita — a mesma leitura das
 * configurações do celular. O olho desce pelos rótulos e cruza a linha até o valor.
 */
export const SettingRow = ({ label, description, divided = false, children }: SettingRowProps) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.row,
        divided && { ...styles.divided, borderTopColor: theme.colors.truco.divider },
      ]}
    >
      <View style={styles.text}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>{label}</Text>
        {description !== undefined && (
          <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
            {description}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: ms(16), paddingVertical: ms(8) },
  divided: { borderTopWidth: 1 },
  text: { flex: 1, gap: ms(5) },
  label: { fontFamily: 'Minecraft', fontSize: ms(11) },
  description: { fontFamily: 'Minecraft', fontSize: ms(9), lineHeight: ms(13), opacity: 0.6 },
});
