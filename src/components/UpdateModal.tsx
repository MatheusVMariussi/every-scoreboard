import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms, wp } from '../theme/responsive';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  currentVersion?: string;
  latestVersion?: string;
}

export const UpdateModal = ({
  visible,
  onClose,
  onUpdate,
  currentVersion,
  latestVersion,
}: UpdateModalProps) => {
  const { theme } = useTheme();

  const showVersions = Boolean(currentVersion && latestVersion);

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
                  borderColor: theme.colors.neon.primary,
                  shadowColor: theme.colors.neon.glow,
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.headerTitle}>
                  <MaterialCommunityIcons
                    name="rocket-launch-outline"
                    size={ms(24)}
                    color={theme.colors.neon.primary}
                  />
                  <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {translate('home.update_title').toUpperCase()}
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
                {translate('home.update_message')}
              </Text>

              {showVersions && (
                <View style={styles.versionRow}>
                  <Text style={[styles.versionText, { color: theme.colors.text.secondary }]}>
                    {currentVersion}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={ms(14)}
                    color={theme.colors.text.secondary}
                  />
                  <Text style={[styles.versionText, { color: theme.colors.neon.primary }]}>
                    {latestVersion}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <View style={styles.actionsColumn}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.brand.primary }]}
                  onPress={onUpdate}
                >
                  <Ionicons
                    name="cloud-download-outline"
                    size={ms(18)}
                    color={theme.colors.text.white}
                    style={{ marginRight: ms(8) }}
                  />
                  <Text style={[styles.actionText, { color: theme.colors.text.white }]}>
                    {translate('home.update_now')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { borderColor: theme.colors.text.secondary, borderWidth: 1 },
                  ]}
                  onPress={onClose}
                >
                  <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                    {translate('home.cancel')}
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: ms(16),
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(20),
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: ms(10), flexShrink: 1 },
  title: { fontFamily: 'Minecraft', fontSize: ms(18), flexShrink: 1 },
  message: {
    fontFamily: 'Minecraft',
    fontSize: ms(14),
    lineHeight: ms(22),
    textAlign: 'left',
    marginBottom: ms(10),
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(10),
    marginTop: ms(6),
  },
  versionText: { fontFamily: 'Minecraft', fontSize: ms(13) },
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
