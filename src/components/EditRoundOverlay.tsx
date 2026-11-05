import type { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';

interface EditRoundOverlayProps {
  roundIndex: number;
  /**
   * Fundo, X e "salvar" passam todos por aqui: quem chama decide se pode fechar (a
   * Cacheta valida os ganhadores da rodada antes).
   */
  onClose: () => void;
  onDelete: () => void;
  width: number;
  /** Uma linha por jogador, com o controle de cada jogo. */
  children: ReactNode;
}

/**
 * Moldura da edição de uma rodada já fechada. Fica na raiz da tela de jogo, por cima da
 * tabela, e não num `Modal` — assim herda a orientação de paisagem da tela.
 */
export const EditRoundOverlay = ({
  roundIndex,
  onClose,
  onDelete,
  width,
  children,
}: EditRoundOverlayProps) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
        accessible={false}
      />
      <View
        style={[
          styles.card,
          {
            width,
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.text.secondary,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {translate('common.edit_round', { index: roundIndex + 1 })}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={translate('a11y.close')}
          >
            <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.bodyContent}>{children}</ScrollView>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.fodinha.divider }]}>
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={[styles.deleteText, { color: theme.colors.status.error }]}>
              {translate('cacheta.delete_round')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.saveBtn, { backgroundColor: theme.colors.brand.primary }]}
          >
            <Text style={[styles.saveText, { color: theme.colors.text.white }]}>
              {translate('common.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: { maxHeight: '85%', padding: ms(20), borderRadius: ms(20), borderWidth: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  title: { fontFamily: 'Minecraft', fontSize: ms(14), textAlign: 'center' },
  body: { flexShrink: 1 },
  bodyContent: { paddingBottom: ms(20) },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ms(15),
    paddingTop: ms(10),
    borderTopWidth: 1,
  },
  deleteBtn: { padding: ms(10) },
  deleteText: { fontFamily: 'Minecraft', fontSize: ms(12), textDecorationLine: 'underline' },
  saveBtn: { paddingHorizontal: ms(20), paddingVertical: ms(8), borderRadius: ms(8) },
  saveText: { fontFamily: 'Minecraft' },
});
