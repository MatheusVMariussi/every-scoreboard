import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface EditNameModalProps {
  visible: boolean;
  initialValue: string;
  onSave: (newName: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const EditNameModal = ({ visible, initialValue, onSave, onDelete, onClose }: EditNameModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setName(initialValue);
      const timer = setTimeout(() => { Keyboard.dismiss(); }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, initialValue]);

  const handleSave = () => {
    onSave(name);
    Keyboard.dismiss();
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
        onDelete();
        Keyboard.dismiss();
        onClose(); 
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>
              
              {/* HEADER: TÍTULO + LIXEIRA (SE HOUVER) */}
              <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {translate('common.edit_name')}
                  </Text>
                  {onDelete && (
                    <TouchableOpacity onPress={handleDelete} style={styles.trashBtn}>
                        <Ionicons name="trash-outline" size={22} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  )}
              </View>
              
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary, borderColor: theme.colors.text.secondary }]}
                value={name}
                onChangeText={setName}
                autoFocus={false}
                maxLength={12}
                placeholderTextColor={theme.colors.text.secondary}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onClose} style={styles.btn}>
                  <Text style={{ color: theme.colors.status.error, fontFamily: 'Minecraft' }}>{translate('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.btn, styles.saveBtn, { backgroundColor: theme.colors.brand.primary }]}>
                  <Text style={{ color: '#FFF', fontFamily: 'Minecraft' }}>{translate('common.save')}</Text>
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
  container: { width: '60%', padding: 20, borderRadius: 15, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15, position: 'relative' },
  title: { fontFamily: 'Minecraft', fontSize: 14, textAlign: 'center' },
  trashBtn: { position: 'absolute', right: 0, padding: 5 }, // Lixeira no canto direito
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontFamily: 'Minecraft', fontSize: 14, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  btn: { padding: 10 },
  saveBtn: { borderRadius: 8, paddingHorizontal: 20 }
});