import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ms } from '../../theme/responsive';

interface HelpTextProps {
  children: ReactNode;
  /** Texto de apoio, mais apagado. */
  muted?: boolean;
  center?: boolean;
}

/**
 * Corpo de texto dos guias. Fonte do sistema: a pixelada do jogo fica para títulos,
 * rótulos e números, porque em parágrafo ela cansa e ocupa o dobro da largura.
 */
export const HelpText = ({ children, muted = false, center = false }: HelpTextProps) => {
  const { theme } = useTheme();

  return (
    <Text
      style={[
        styles.text,
        { color: theme.colors.text.secondary },
        muted && styles.muted,
        center && styles.center,
      ]}
    >
      {children}
    </Text>
  );
};

/** A regra que não pode passar batida: texto forte com um filete dourado à esquerda. */
export const HelpCallout = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.callout, { borderLeftColor: theme.colors.truco.scoreText }]}>
      <Text style={[styles.text, styles.calloutText, { color: theme.colors.text.primary }]}>
        {children}
      </Text>
    </View>
  );
};

/** Rótulo curto na fonte do jogo: nomes de coluna, legendas, "EMPATE". */
export const HelpLabel = ({ children, color }: { children: ReactNode; color?: string }) => {
  const { theme } = useTheme();

  return (
    <Text style={[styles.label, { color: color ?? theme.colors.text.secondary }]}>{children}</Text>
  );
};

interface HelpSplitProps {
  /** O exemplo, à esquerda, na largura que precisar. */
  visual: ReactNode;
  /** A explicação, à direita, com o resto da largura. */
  children: ReactNode;
}

/** Exemplo ao lado da explicação: em paisagem sobra largura e falta altura. */
export const HelpSplit = ({ visual, children }: HelpSplitProps) => (
  <View style={styles.split}>
    <View style={styles.splitVisual}>{visual}</View>
    <View style={styles.splitText}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  text: { fontSize: ms(13), lineHeight: ms(19) },
  muted: { opacity: 0.6 },
  center: { textAlign: 'center' },
  callout: { borderLeftWidth: ms(2), paddingLeft: ms(10) },
  calloutText: { fontWeight: '600' },
  label: { fontFamily: 'Minecraft', fontSize: ms(8) },
  split: { flexDirection: 'row', alignItems: 'center', gap: ms(24) },
  splitVisual: { alignItems: 'center' },
  splitText: { flex: 1, gap: ms(10) },
});
