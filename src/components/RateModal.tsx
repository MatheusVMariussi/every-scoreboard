import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms, wp } from '../theme/responsive';

interface RateModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RateModal = ({ visible, onClose }: RateModalProps) => {
  const { theme } = useTheme();

  const handleOpenStore = () => {
    if (Platform.OS === 'android') {
      Linking.openURL('market://details?id=com.servyy.everyscoreboard');
    } else {
      const APP_STORE_ID = '6758025911';
      Linking.openURL(`itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`);
    }
    onClose();
  };

  const handleOpenPortfolio = () => {
    Linking.openURL('https://matheusmariussi.com.br/#/every-scoreboard');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.brand.primary,
                },
              ]}
            >
              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: ms(10) }}>
                  <MaterialCommunityIcons
                    name="diamond-stone"
                    size={ms(24)}
                    color={theme.colors.neon.secondary}
                  />
                  <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {translate('rateModal.rate_title')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
                {translate('rateModal.rate_message')}
              </Text>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <View style={styles.actionsColumn}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.brand.primary }]}
                  onPress={handleOpenStore}
                >
                  <Ionicons
                    name="star"
                    size={ms(18)}
                    color={theme.colors.text.white}
                    style={{ marginRight: ms(8) }}
                  />
                  <Text style={[styles.actionText, { color: theme.colors.text.white }]}>
                    {translate('rateModal.rate_now')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { borderColor: theme.colors.text.secondary, borderWidth: 1 },
                  ]}
                  onPress={handleOpenPortfolio}
                >
                  <Ionicons
                    name="globe-outline"
                    size={ms(18)}
                    color={theme.colors.text.primary}
                    style={{ marginRight: ms(8) }}
                  />
                  <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                    {translate('rateModal.rate_contact')}
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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: ms(20) },
  container: {
    width: wp('90%'),
    maxWidth: ms(400),
    padding: ms(24),
    borderRadius: ms(20),
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(20),
  },
  title: { fontFamily: 'Minecraft', fontSize: ms(18) },
  message: {
    fontFamily: 'Minecraft',
    fontSize: ms(14),
    lineHeight: ms(22),
    textAlign: 'left',
    marginBottom: ms(10),
  },
  divider: { height: 1, marginVertical: ms(20) },
  actionsColumn: { gap: ms(12) },
  actionBtn: {
    flexDirection: 'row',
    padding: ms(15),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontFamily: 'Minecraft', fontSize: ms(14) },
});
