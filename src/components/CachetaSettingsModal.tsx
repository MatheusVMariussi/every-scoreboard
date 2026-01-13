import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface CachetaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  initialPoints: number;
  setInitialPoints: (points: number) => void;
}

export const CachetaSettingsModal = ({ 
  visible, onClose, onReset, 
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
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
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
                  <TouchableOpacity onPress={() => adjustPoints(-1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary }]}>
                    <Ionicons name="remove" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>

                  <Text style={[styles.pointsValue, { color: theme.colors.truco.scoreText }]}>{initialPoints}</Text>

                  <TouchableOpacity onPress={() => adjustPoints(1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary }]}>
                    <Ionicons name="add" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Botão de Reset */}
              <TouchableOpacity style={[styles.resetBtn, { backgroundColor: theme.colors.status.error }]} onPress={() => { onReset(); onClose(); }}>
                <Text style={styles.resetText}>{translate('common.reset_match').toUpperCase()}</Text>
              </TouchableOpacity>

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
  counterBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  pointsValue: { fontFamily: 'Minecraft', fontSize: 32 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  resetBtn: { padding: 12, borderRadius: 10, alignItems: 'center' },
  resetText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 14 }
});