import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

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

  const adjustPoints = (amount: number) => {
    const newVal = Math.max(1, Math.min(99, initialPoints + amount));
    setInitialPoints(newVal);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>
              
              {/* Header do Modal */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{translate('settings.title')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Controle de Pontos Iniciais */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('cacheta.initial_points')}</Text>
                
                <View style={styles.counterRow}>
                  <TouchableOpacity onPress={() => adjustPoints(-1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay }]}>
                    <Ionicons name="remove" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>

                  <Text style={[styles.pointsValue, { color: theme.colors.truco.scoreText }]}>{initialPoints}</Text>

                  <TouchableOpacity onPress={() => adjustPoints(1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay }]}>
                    <Ionicons name="add" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <View style={styles.actionsRow}>
                  <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: theme.colors.text.secondary, borderWidth: 1 }]}
                      onPress={onOpenHelp}
                  >
                      <Ionicons name="book-outline" size={20} color={theme.colors.text.primary} style={{ marginRight: 8 }} />
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
  container: { width: '60%', padding: 24, borderRadius: 20, borderWidth: 1 }, // 60% de largura fica bom em Landscape
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'Minecraft', fontSize: 18 },
  section: { marginBottom: 20, alignItems: 'center' },
  label: { fontSize: 12, fontFamily: 'Minecraft', marginBottom: 10, opacity: 0.8 },
  
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  pointsValue: { fontFamily: 'Minecraft', fontSize: 32 },

  divider: { height: 1, marginBottom: 20 },
  actionsRow: { gap: 10 },
  actionBtn: { flexDirection: 'row', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Minecraft', fontSize: 14 }
});