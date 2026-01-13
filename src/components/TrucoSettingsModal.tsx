import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { Ionicons } from '@expo/vector-icons';

interface TrucoSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  gameMode: 'paulista' | 'mineiro';
  setGameMode: (mode: 'paulista' | 'mineiro') => void;
  maxScore: number;
  setMaxScore: (score: number) => void;
}

export const TrucoSettingsModal = ({ 
  visible, onClose, onReset, 
  gameMode, setGameMode,
  maxScore, setMaxScore 
}: TrucoSettingsModalProps) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>
              
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{translate('settings.title')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* MODO DE JOGO */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('truco.game_mode')}</Text>
                <View style={styles.row}>
                  <OptionBtn 
                    label="PAULISTA" 
                    active={gameMode === 'paulista'} 
                    onPress={() => setGameMode('paulista')} 
                    theme={theme}
                  />
                  <OptionBtn 
                    label="MINEIRO" 
                    active={gameMode === 'mineiro'} 
                    onPress={() => setGameMode('mineiro')} 
                    theme={theme}
                  />
                </View>
              </View>

              {/* NOVO: PONTUAÇÃO MÁXIMA */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('truco.max_score')}</Text>
                <View style={styles.row}>
                  <OptionBtn 
                    label="12 PONTOS" 
                    active={maxScore === 12} 
                    onPress={() => setMaxScore(12)} 
                    theme={theme}
                  />
                  <OptionBtn 
                    label="24 PONTOS" 
                    active={maxScore === 24} 
                    onPress={() => setMaxScore(24)} 
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

const OptionBtn = ({ label, active, onPress, theme }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[
      styles.optBtn, 
      { 
        backgroundColor: active ? theme.colors.brand.primary : 'transparent',
        borderColor: active ? theme.colors.brand.primary : theme.colors.text.secondary
      }
    ]}
  >
    <Text style={[styles.optText, { color: active ? '#FFF' : theme.colors.text.secondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', padding: 24, borderRadius: 20, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { fontFamily: 'Minecraft', fontSize: 18 },
  section: { marginBottom: 20 },
  label: { fontSize: 10, fontFamily: 'Minecraft', marginBottom: 10, opacity: 0.7 },
  row: { flexDirection: 'row', gap: 10 },
  optBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  optText: { fontFamily: 'Minecraft', fontSize: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  resetBtn: { padding: 15, borderRadius: 10, alignItems: 'center' },
  resetText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 14 }
});