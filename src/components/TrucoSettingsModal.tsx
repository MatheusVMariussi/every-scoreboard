import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface TrucoSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  gameMode: 'paulista' | 'mineiro';
  setGameMode: (mode: 'paulista' | 'mineiro') => void;
}

export const TrucoSettingsModal = ({ visible, onClose, onReset, gameMode, setGameMode }: TrucoSettingsModalProps) => {
  const { theme } = useTheme();

  const handleModeChange = (newMode: 'paulista' | 'mineiro') => {
    if (newMode === gameMode) return;

    Alert.alert(
      translate('common.confirm_change_title'),
      translate('common.confirm_change_message'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.confirm'),
          style: 'destructive',
          onPress: () => {
            setGameMode(newMode); // Executa a mudança de modo
            onClose(); // Fecha o modal após mudar
          },
        },
      ]
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.modal.overlay }]}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.modal.background, borderColor: theme.colors.truco.scoreText }]}>
              
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{translate('common.configurations')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.modal.textInactive }]}>{translate('truco.game_type')}</Text>
                <View style={styles.row}>
                  <TouchableOpacity 
                    style={[styles.optionBtn, { 
                      borderColor: gameMode === 'paulista' ? 'transparent' : theme.colors.modal.textInactive,
                      backgroundColor: gameMode === 'paulista' ? theme.colors.modal.buttonActive : theme.colors.modal.buttonInactive 
                    }]}
                    onPress={() => handleModeChange('paulista')}
                  >
                    <Text style={[styles.optionText, { color: gameMode === 'paulista' ? theme.colors.modal.textActive : theme.colors.modal.textInactive }]}>
                      {translate('truco.paulista')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.optionBtn, { 
                      borderColor: gameMode === 'mineiro' ? 'transparent' : theme.colors.modal.textInactive,
                      backgroundColor: gameMode === 'mineiro' ? theme.colors.modal.buttonActive : theme.colors.modal.buttonInactive 
                    }]}
                    onPress={() => handleModeChange('mineiro')}
                  >
                    <Text style={[styles.optionText, { color: gameMode === 'mineiro' ? theme.colors.modal.textActive : theme.colors.modal.textInactive }]}>
                      {translate('truco.mineiro')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <TouchableOpacity 
                style={[styles.resetBtn, { backgroundColor: theme.colors.status.error }]} 
                onPress={() => {
                  Alert.alert(
                    translate('common.confirm_reset_title'),
                    translate('common.confirm_reset_message'),
                    [
                      { text: translate('common.cancel'), style: 'cancel' },
                      { text: translate('common.confirm'), style: 'destructive', onPress: onReset }
                    ]
                  );
                }}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.text.inverse} style={{ marginRight: 8 }} />
                <Text style={[styles.resetText, { color: theme.colors.text.inverse }]}>{translate('common.reset_match')}</Text>
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
  modalContainer: { width: '85%', padding: 24, borderRadius: 16, borderWidth: 1, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Minecraft', fontSize: 18 },
  section: { marginBottom: 24 },
  label: { fontSize: 12, marginBottom: 12, fontFamily: 'Minecraft', opacity: 0.8 },
  row: { flexDirection: 'row', gap: 12 },
  optionBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  optionText: { fontWeight: 'bold', fontFamily: 'Minecraft', fontSize: 12 },
  divider: { height: 1, marginBottom: 24 },
  resetBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 8 },
  resetText: { fontWeight: 'bold', fontFamily: 'Minecraft' }
});