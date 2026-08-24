/**
 * Aviso antes de ligar o modo sempre ouvindo.
 *
 * Aparece **toda vez** que o modo é ativado, até o usuário marcar "não avisar
 * novamente". As duas advertências são reais e não devem ser suavizadas: bateria e erro
 * em ambiente barulhento. A segunda também explica por que existe a fila de aprovação.
 *
 * Segue o mesmo padrão dos outros modais da base: `Modal` + duplo
 * `TouchableWithoutFeedback` para o toque fora fechar e o de dentro não.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { translate } from '../../i18n';
import { ms, wp } from '../../theme/responsive';
import { useTheme } from '../../theme/useTheme';

interface Props {
  visible: boolean;
  onCancel: () => void;
  /** `dontWarnAgain` é gravado pela tela, não aqui — o modal não conhece storage. */
  onConfirm: (dontWarnAgain: boolean) => void;
}

export const VoiceWarningModal = ({ visible, onCancel, onConfirm }: Props) => {
  const { theme } = useTheme();
  const [dontWarnAgain, setDontWarnAgain] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: theme.colors.voice.panel,
                  borderColor: theme.colors.status.warning,
                },
              ]}
            >
              <View style={styles.titleRow}>
                <Ionicons
                  name="warning-outline"
                  size={ms(18)}
                  color={theme.colors.status.warning}
                />
                <Text style={[styles.title, { color: theme.colors.status.warning }]}>
                  {translate('voice.warning_title')}
                </Text>
              </View>

              <View style={styles.bullet}>
                <Ionicons
                  name="battery-half-outline"
                  size={ms(14)}
                  color={theme.colors.voice.idleText}
                />
                <Text style={[styles.bulletText, { color: theme.colors.voice.idleText }]}>
                  {translate('voice.warning_battery')}
                </Text>
              </View>

              <View style={styles.bullet}>
                <Ionicons name="ear-outline" size={ms(14)} color={theme.colors.voice.idleText} />
                <Text style={[styles.bulletText, { color: theme.colors.voice.idleText }]}>
                  {translate('voice.warning_noise')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setDontWarnAgain((previous) => !previous);
                }}
                style={styles.checkboxRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: dontWarnAgain }}
                accessibilityLabel={translate('voice.warning_dont_show')}
              >
                <Ionicons
                  name={dontWarnAgain ? 'checkbox' : 'square-outline'}
                  size={ms(16)}
                  color={dontWarnAgain ? theme.colors.voice.active : theme.colors.voice.idleText}
                />
                <Text style={[styles.checkboxText, { color: theme.colors.voice.idleText }]}>
                  {translate('voice.warning_dont_show')}
                </Text>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={onCancel}
                  style={[styles.action, { borderColor: theme.colors.voice.border }]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionText, { color: theme.colors.voice.idleText }]}>
                    {translate('voice.warning_cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    onConfirm(dontWarnAgain);
                  }}
                  style={[
                    styles.action,
                    {
                      borderColor: theme.colors.voice.active,
                      backgroundColor: theme.colors.voice.activeSoft,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionText, { color: theme.colors.voice.active }]}>
                    {translate('voice.warning_enable')}
                  </Text>
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
  container: {
    width: wp('70%'),
    maxWidth: ms(420),
    borderWidth: ms(2),
    borderRadius: ms(15),
    padding: ms(16),
    gap: ms(12),
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  title: { fontFamily: 'Minecraft', fontSize: ms(13) },
  bullet: { flexDirection: 'row', gap: ms(8), alignItems: 'flex-start' },
  bulletText: { fontFamily: 'Minecraft', fontSize: ms(9), lineHeight: ms(15), flex: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8), paddingVertical: ms(4) },
  checkboxText: { fontFamily: 'Minecraft', fontSize: ms(9) },
  actions: { flexDirection: 'row', gap: ms(10) },
  action: {
    flex: 1,
    borderWidth: 1,
    borderRadius: ms(8),
    paddingVertical: ms(10),
    alignItems: 'center',
  },
  actionText: { fontFamily: 'Minecraft', fontSize: ms(10) },
});
