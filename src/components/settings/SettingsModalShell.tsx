import type { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';

interface SettingsModalShellProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Abre o "como jogar"; quem chama troca este modal pelo de ajuda. */
  onOpenHelp: () => void;
  /** Zera a partida. O modal fecha logo em seguida. */
  onReset: () => void;
  width: number;
  /** Paisagem: espaçamentos menores e as duas ações lado a lado. */
  compact?: boolean;
  /** As opções do jogo, entre o cabeçalho e as ações. */
  children: ReactNode;
}

/** Moldura das configurações de jogo: fundo, cabeçalho com fechar e as ações de rodapé. */
export const SettingsModalShell = ({
  visible,
  onClose,
  title,
  onOpenHelp,
  onReset,
  width,
  compact = false,
  children,
}: SettingsModalShellProps) => {
  const { theme } = useTheme();
  const size = compact ? compactStyles : regularStyles;

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
          {/* Sem onPress: só impede que o toque no cartão chegue ao fundo e feche. */}
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                size.container,
                {
                  width,
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.truco.scoreText,
                },
              ]}
            >
              <View style={[styles.header, size.header]}>
                <Text style={[styles.title, size.title, { color: theme.colors.text.primary }]}>
                  {title}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={translate('a11y.close')}
                >
                  <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {children}

              <View
                style={[
                  styles.divider,
                  size.divider,
                  { backgroundColor: theme.colors.modal.divider },
                ]}
              />

              <View style={size.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    size.actionBtn,
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
                  <Text
                    style={[
                      styles.actionText,
                      size.actionText,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {translate('common.how_to_play')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    size.actionBtn,
                    { backgroundColor: theme.colors.status.error },
                  ]}
                  onPress={() => {
                    onReset();
                    onClose();
                  }}
                >
                  <Text
                    style={[styles.actionText, size.actionText, { color: theme.colors.text.white }]}
                  >
                    {translate('common.reset_match')}
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

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { borderRadius: ms(20), borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Minecraft' },
  divider: { height: 1, width: '100%' },
  actionBtn: {
    flexDirection: 'row',
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontFamily: 'Minecraft' },
});

const regularStyles = StyleSheet.create({
  container: { padding: ms(24) },
  header: { marginBottom: ms(20) },
  title: { fontSize: ms(18) },
  divider: { marginBottom: ms(20) },
  actions: { gap: ms(10) },
  actionBtn: { padding: ms(12) },
  actionText: { fontSize: ms(14) },
});

const compactStyles = StyleSheet.create({
  container: { padding: ms(20) },
  header: { marginBottom: ms(15) },
  title: { fontSize: ms(14) },
  divider: { marginTop: ms(10), marginBottom: ms(10) },
  actions: { flexDirection: 'row', gap: ms(15) },
  actionBtn: { flex: 1, padding: ms(10) },
  actionText: { fontSize: ms(12) },
});
