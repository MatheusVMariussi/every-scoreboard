import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms, wp } from '../theme/responsive';

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

  // Hardcoded Dark Colors for Game Consistency
  const DARK_BG = '#222222';
  const TEXT_COLOR = '#FFFFFF';
  const BORDER_COLOR = '#AAAAAA';

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
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: DARK_BG, borderColor: theme.colors.truco.scoreText }]}>

              {/* HEADER: TÍTULO + LIXEIRA (SE HOUVER) */}
              <View style={styles.header}>
                  <Text style={[styles.title, { color: TEXT_COLOR }]}>
                    {translate('common.edit_name')}
                  </Text>
                  {onDelete && (
                    <TouchableOpacity onPress={handleDelete} style={styles.trashBtn}>
                        <Ionicons name="trash-outline" size={ms(22)} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  )}
              </View>

              <TextInput
                style={[styles.input, { color: TEXT_COLOR, borderColor: BORDER_COLOR }]}
                value={name}
                onChangeText={setName}
                autoFocus={false}
                maxLength={12}
                placeholderTextColor={BORDER_COLOR}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onClose} style={styles.btn}>
                  <Text style={{ color: theme.colors.status.error, fontFamily: 'Minecraft' }}>{translate('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.btn, styles.saveBtn, { backgroundColor: theme.colors.brand.primary }]}>
                  <Text style={{ color: theme.colors.text.white, fontFamily: 'Minecraft' }}>{translate('common.save')}</Text>
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
  container: { width: wp('60%'), maxWidth: ms(350), padding: ms(20), borderRadius: ms(15), borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: ms(15), position: 'relative' },
  title: { fontFamily: 'Minecraft', fontSize: ms(14), textAlign: 'center' },
  trashBtn: { position: 'absolute', right: 0, padding: ms(5) },
  input: { borderWidth: 1, borderRadius: ms(8), padding: ms(10), fontFamily: 'Minecraft', fontSize: ms(14), marginBottom: ms(20) },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: ms(15) },
  btn: { padding: ms(10) },
  saveBtn: { borderRadius: ms(8), paddingHorizontal: ms(20) }
});
