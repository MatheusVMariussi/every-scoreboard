import { useState, useEffect } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms, wp } from '../theme/responsive';
import { useKeyboardLift } from '../hooks/useKeyboardLift';
import { MAX_LIVES } from '../hooks/useFodinhaGame';
import { Stepper } from './settings/Stepper';

interface EditNameModalProps {
  visible: boolean;
  initialValue: string;
  /**
   * Fodinha: as vidas do jogador, editadas junto com o nome e aplicadas só ao salvar.
   * Sem isso, o modal só renomeia.
   */
  initialLives?: number;
  /** `lives` só vem quando o modal foi aberto com `initialLives`. */
  onSave: (newName: string, lives?: number) => void;
  onDelete?: () => void;
  onClose: () => void;
  /** iOS: o modal terminou de sair da tela. O Android não avisa (ver `Modal.onDismiss`). */
  onDismiss?: () => void;
}

/** Folga entre o card e o teclado quando ele sobe. */
const KEYBOARD_GAP = ms(10);
/** Com as vidas ao lado do nome, o card precisa de mais largura que o de só renomear. */
const WITH_LIVES_SCREEN_RATIO = 0.6;
const WITH_LIVES_MAX_WIDTH = ms(440);

export const EditNameModal = ({
  visible,
  initialValue,
  initialLives,
  onSave,
  onDelete,
  onClose,
  onDismiss,
}: EditNameModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState(initialValue);
  const [lives, setLives] = useState(initialLives);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const lift = useKeyboardLift(visible, { gap: KEYBOARD_GAP, minTop: insets.top + ms(8) });

  // Hardcoded Dark Colors for Game Consistency
  const DARK_BG = '#222222';
  const TEXT_COLOR = '#FFFFFF';
  const BORDER_COLOR = '#AAAAAA';

  // Ao abrir, o formulário recomeça com o jogador de agora. Ajustado durante o render,
  // e não num efeito, para não aparecer por um quadro o valor do jogador anterior.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setName(initialValue);
      setLives(initialLives);
    }
  }

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      Keyboard.dismiss();
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [visible]);

  const handleSave = () => {
    onSave(name, lives);
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

  const cardWidth =
    lives === undefined
      ? styles.nameOnlyWidth
      : { width: Math.min(width * WITH_LIVES_SCREEN_RATIO, WITH_LIVES_MAX_WIDTH) };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {/* Do tamanho da janela: o `onLayout` do card dá a posição dele na tela. */}
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              onLayout={lift.onLayout}
              style={[
                styles.container,
                cardWidth,
                {
                  backgroundColor: DARK_BG,
                  borderColor: theme.colors.truco.scoreText,
                  transform: lift.transform,
                },
              ]}
            >
              {/* HEADER: TÍTULO + LIXEIRA (SE HOUVER) */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: TEXT_COLOR }]}>
                  {lives === undefined
                    ? translate('common.edit_name')
                    : translate('fodinha.edit_player')}
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

              {/* Nome e vidas na mesma linha: o card fica baixo e cabe acima do teclado. */}
              <View style={styles.fieldsRow}>
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
                {lives !== undefined && (
                  <View style={styles.livesField}>
                    <Ionicons name="heart" size={ms(16)} color={theme.colors.status.error} />
                    <Stepper
                      label={translate('fodinha.lives')}
                      value={lives}
                      canDecrease={lives > 0}
                      canIncrease={lives < MAX_LIVES}
                      onChange={(delta) => {
                        setLives(Math.max(0, Math.min(MAX_LIVES, lives + delta)));
                      }}
                    />
                  </View>
                )}
              </View>

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
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Compacto na vertical: em paisagem sobra pouca altura acima do teclado de um iPhone.
  container: {
    paddingHorizontal: ms(20),
    paddingVertical: ms(14),
    borderRadius: ms(15),
    borderWidth: 1,
  },
  nameOnlyWidth: { width: wp('60%'), maxWidth: ms(350) },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(10),
    position: 'relative',
  },
  title: { fontFamily: 'Minecraft', fontSize: ms(14), textAlign: 'center' },
  trashBtn: { position: 'absolute', right: 0, padding: ms(5) },
  fieldsRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12), marginBottom: ms(12) },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: ms(8),
    fontFamily: 'Minecraft',
    fontSize: ms(14),
  },
  livesField: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
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
