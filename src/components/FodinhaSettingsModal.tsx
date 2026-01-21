import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface FodinhaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
  initialLives: number;
  setInitialLives: (lives: number) => void;
  penaltyMode: 'fixed' | 'difference';
  setPenaltyMode: (mode: 'fixed' | 'difference') => void;
}

export const FodinhaSettingsModal = ({ 
  visible, onClose, onReset, onOpenHelp,
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
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>

              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{translate('fodinha.settings_title')}</Text>
                <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={theme.colors.text.primary} /></TouchableOpacity>
              </View>

              {/* VIDAS INICIAIS */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('fodinha.initial_lives')}</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity onPress={() => adjustLives(-1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay }]}>
                    <Ionicons name="remove" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.pointsValue, { color: theme.colors.truco.scoreText }]}>{initialLives}</Text>
                  <TouchableOpacity onPress={() => adjustLives(1)} style={[styles.counterBtn, { borderColor: theme.colors.text.secondary, backgroundColor: theme.colors.background.overlay }]}>
                    <Ionicons name="add" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* MODO DE PUNIÇÃO */}
              <View style={[styles.section, { marginBottom: 5 }]}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('fodinha.penalty_mode')}</Text>
                <View style={styles.row}>
                  <OptionBtn
                    label={translate('fodinha.fixed')}
                    subLabel={translate('fodinha.fixed_desc')}
                    active={penaltyMode === 'fixed'}
                    onPress={() => setPenaltyMode('fixed')}
                    theme={theme}
                  />
                  <OptionBtn
                    label={translate('fodinha.difference')}
                    subLabel={translate('fodinha.difference_desc')}
                    active={penaltyMode === 'difference'}
                    onPress={() => setPenaltyMode('difference')}
                    theme={theme}
                  />
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
                  <Text style={[styles.actionText, { color: theme.colors.text.white }]}>{translate('common.reset_match').toUpperCase()}</Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const OptionBtn = ({ label, subLabel, active, onPress, theme }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.optBtn, { backgroundColor: active ? theme.colors.brand.primary : 'transparent', borderColor: active ? theme.colors.brand.primary : theme.colors.text.secondary }]}>
    <Text style={[styles.optText, { color: active ? theme.colors.text.white : theme.colors.text.secondary }]}>{label}</Text>
    <Text style={[styles.optSubText, { color: active ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary }]}>{subLabel}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { width: '50%', padding: 20, borderRadius: 20, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontFamily: 'Minecraft', fontSize: 14 },
  section: { marginBottom: 15, alignItems: 'center', width: '100%' },
  label: { fontSize: 10, fontFamily: 'Minecraft', marginBottom: 5, opacity: 0.8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  pointsValue: { fontFamily: 'Minecraft', fontSize: 28 },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  optBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  optText: { fontFamily: 'Minecraft', fontSize: 11, marginBottom: 2 },
  optSubText: { fontSize: 7, fontFamily: 'Minecraft', opacity: 0.6 },
  divider: { height: 1, marginBottom: 0, marginTop: 10, width: '100%' },
  actionsRow: { flexDirection: 'row', gap: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Minecraft', fontSize: 12 },
});