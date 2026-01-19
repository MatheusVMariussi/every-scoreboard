import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { Ionicons } from '@expo/vector-icons';

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const TutorialModal = ({ visible, onClose, title, children }: TutorialModalProps) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>

              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="school" size={24} color={theme.colors.brand.primary} />
                    <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                {children}
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.colors.brand.primary }]} onPress={onClose}>
                <Text style={styles.closeText}>{translate('common.got_it')}</Text>
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
  container: { width: '85%', padding: 24, borderRadius: 20, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'Minecraft', fontSize: 18 },
  content: { marginBottom: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  closeBtn: { padding: 15, borderRadius: 10, alignItems: 'center' },
  closeText: { color: '#FFF', fontFamily: 'Minecraft', fontSize: 14 }
});
