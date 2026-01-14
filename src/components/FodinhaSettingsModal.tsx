import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface FodinhaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  initialLives: number;
  setInitialLives: (lives: number) => void;
  penaltyMode: 'fixed' | 'difference'; // 'fixed' = perde 1 vida se errar. 'difference' = perde a diferença (errou por 3, perde 3).
  setPenaltyMode: (mode: 'fixed' | 'difference') => void;
}

export const FodinhaSettingsModal = ({ 
  visible, onClose, onReset, 
  initialLives, setInitialLives,
  penaltyMode, setPenaltyMode
}: FodinhaSettingsModalProps) => {
  const { theme } = useTheme();

  const adjustLives = (amount: number) => {
    setInitialLives(Math.max(1, Math.min(50, initialLives + amount)));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>
              
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>CONFIGURAÇÕES FODINHA</Text>
                <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={theme.colors.text.primary} /></TouchableOpacity>
              </View>

              {/* VIDAS INICIAIS */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>VIDAS INICIAIS</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity onPress={() => adjustLives(-1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary }]}>
                    <Ionicons name="remove" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.pointsValue, { color: theme.colors.truco.scoreText }]}>{initialLives}</Text>
                  <TouchableOpacity onPress={() => adjustLives(1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary }]}>
                    <Ionicons name="add" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* MODO DE PUNIÇÃO */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>MODO DE PUNIÇÃO</Text>
                <View style={styles.row}>
                  <OptionBtn 
                    label="FIXO (1)" 
                    subLabel="Errou = -1 vida"
                    active={penaltyMode === 'fixed'} 
                    onPress={() => setPenaltyMode('fixed')} 
                    theme={theme}
                  />
                  <OptionBtn 
                    label="DIFERENÇA" 
                    subLabel="Errou por 3 = -3 vidas"
                    active={penaltyMode === 'difference'} 
                    onPress={() => setPenaltyMode('difference')} 
                    theme={theme}
                  />
                </View>
              </View>

              <View style={styles.divider} />
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

const OptionBtn = ({ label, subLabel, active, onPress, theme }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.optBtn, { backgroundColor: active ? theme.colors.brand.primary : 'transparent', borderColor: active ? theme.colors.brand.primary : theme.colors.text.secondary }]}>
    <Text style={[styles.optText, { color: active ? '#FFF' : theme.colors.text.secondary }]}>{label}</Text>
    <Text style={[styles.optSubText, { color: active ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary }]}>{subLabel}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { width: '60%', padding: 24, borderRadius: 20, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'Minecraft', fontSize: 16 },
  section: { marginBottom: 20, alignItems: 'center', width: '100%' },
  label: { fontSize: 10, fontFamily: 'Minecraft', marginBottom: 10, opacity: 0.8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  pointsValue: { fontFamily: 'Minecraft', fontSize: 32 },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  optBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  optText: { fontFamily: 'Minecraft', fontSize: 12, marginBottom: 4 },
  optSubText: { fontSize: 8, fontFamily: 'Minecraft', opacity: 0.6 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20, width: '100%' },
  resetBtn: { padding: 12, borderRadius: 10, alignItems: 'center', width: '100%' },
  resetText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 14 }
});