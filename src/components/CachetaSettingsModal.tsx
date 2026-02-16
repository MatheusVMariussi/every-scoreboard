import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';

interface CachetaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
  initialPoints: number;
  setInitialPoints: (points: number) => void;
}

export const CachetaSettingsModal = ({
  visible, onClose, onReset, onOpenHelp,
  initialPoints, setInitialPoints
}: CachetaSettingsModalProps) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const adjustPoints = (amount: number) => {
    const newVal = Math.max(1, Math.min(99, initialPoints + amount));
    setInitialPoints(newVal);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { width: width * 0.45, backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>

              {/* Header do Modal */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{translate('settings.title')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Controle de Pontos Iniciais */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('cacheta.initial_points')}</Text>

                <View style={styles.counterRow}>
                  <TouchableOpacity onPress={() => adjustPoints(-1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay }]}>
                    <Ionicons name="remove" size={ms(24)} color={theme.colors.text.primary} />
                  </TouchableOpacity>

                  <Text style={[styles.pointsValue, { color: theme.colors.truco.scoreText }]}>{initialPoints}</Text>

                  <TouchableOpacity onPress={() => adjustPoints(1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay }]}>
                    <Ionicons name="add" size={ms(24)} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <View style={styles.actionsRow}>
                  <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: theme.colors.text.secondary, borderWidth: 1 }]}
                      onPress={onOpenHelp}
                  >
                      <Ionicons name="book-outline" size={ms(20)} color={theme.colors.text.primary} style={{ marginRight: ms(8) }} />
                      <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                          {translate('common.how_to_play')}
                      </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.colors.status.error }]}
                      onPress={() => { onReset(); onClose(); }}
                  >
                      <Text style={[styles.actionText, { color: theme.colors.text.white }]}>
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
  container: { padding: ms(24), borderRadius: ms(20), borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(20) },
  title: { fontFamily: 'Minecraft', fontSize: ms(18) },
  section: { marginBottom: ms(20), alignItems: 'center' },
  label: { fontSize: ms(12), fontFamily: 'Minecraft', marginBottom: ms(10), opacity: 0.8 },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: ms(20) },
  counterBtn: { width: ms(44), height: ms(44), borderRadius: ms(22), borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  pointsValue: { fontFamily: 'Minecraft', fontSize: ms(32) },

  divider: { height: 1, marginBottom: ms(20) },
  actionsRow: { gap: ms(10) },
  actionBtn: { flexDirection: 'row', padding: ms(12), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Minecraft', fontSize: ms(14) }
});
