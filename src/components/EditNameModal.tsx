import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export const EditNameModal = ({
  visible,
  initialValue,
  onSave,
  onDelete,
  onClose,
}: EditNameModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState(initialValue);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  // Hardcoded Dark Colors for Game Consistency
  const DARK_BG = '#222222';
  const TEXT_COLOR = '#FFFFFF';
  const BORDER_COLOR = '#AAAAAA';

  useEffect(() => {
    if (visible) {
      setName(initialValue);
      const timer = setTimeout(() => {
        Keyboard.dismiss();
      }, 100);
      return () => {
        clearTimeout(timer);
      };
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          {/*
           * Dentro do fundo escuro, para a faixa sob o teclado continuar escurecida.
           * iOS: a janela nunca encolhe sozinha, então o padding é o que tira o card de
           * baixo do teclado. Android: dentro do Modal edge-to-edge o evento de teclado não
           * é confiável, e em paisagem o teclado já abre o editor de tela cheia.
           */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.avoider,
              // Em paisagem sobra pouca altura acima do teclado: o card sobe para o topo.
              isLandscape && { justifyContent: 'flex-start', paddingTop: insets.top + ms(12) },
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.container,
                  { backgroundColor: DARK_BG, borderColor: theme.colors.truco.scoreText },
                ]}
              >
                {/* HEADER: TÍTULO + LIXEIRA (SE HOUVER) */}
                <View style={styles.header}>
                  <Text style={[styles.title, { color: TEXT_COLOR }]}>
                    {translate('common.edit_name')}
                  </Text>
                  {onDelete && (
                    <TouchableOpacity
                      onPress={handleDelete}
                      style={styles.trashBtn}
                      accessibilityRole="button"
                      accessibilityLabel={translate('common.delete_player')}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={ms(22)}
                        color={theme.colors.status.error}
                      />
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
                  // "Concluído" salva: em paisagem os botões ficam perto do teclado.
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  keyboardAppearance="dark"
                  selectTextOnFocus
                  // Nome próprio: sem autocorreção, e sem a barra de sugestões do iOS.
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="words"
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity onPress={onClose} style={styles.btn}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.btnLabel, { color: theme.colors.status.error }]}
                    >
                      {translate('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[
                      styles.btn,
                      styles.saveBtn,
                      { backgroundColor: theme.colors.brand.primary },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.btnLabel, { color: theme.colors.text.white }]}
                    >
                      {translate('common.save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  avoider: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Compacto na vertical: em paisagem sobram ~178pt acima do teclado de um iPhone.
  container: {
    width: wp('60%'),
    maxWidth: ms(350),
    paddingHorizontal: ms(20),
    paddingVertical: ms(14),
    borderRadius: ms(15),
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(10),
    position: 'relative',
  },
  title: { fontFamily: 'Minecraft', fontSize: ms(14), textAlign: 'center' },
  trashBtn: { position: 'absolute', right: 0, padding: ms(5) },
  input: {
    borderWidth: 1,
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: ms(8),
    fontFamily: 'Minecraft',
    fontSize: ms(14),
    marginBottom: ms(12),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: ms(12),
  },
  btn: {
    flexShrink: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(8),
    paddingHorizontal: ms(12),
  },
  btnLabel: { fontFamily: 'Minecraft', fontSize: ms(13), textAlign: 'center' },
  saveBtn: { borderRadius: ms(8), paddingHorizontal: ms(18) },
});
