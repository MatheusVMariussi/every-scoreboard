import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VersionCheck from 'react-native-version-check';

import { useTheme } from '../theme/useTheme';
import { type AppLocale, getLocale, setLocale, translate } from '../i18n';
import { clearAllData } from '../utils/storage';
import { updateSettings } from '../utils/appSettings';
import { ms, wp } from '../theme/responsive';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const SettingsModal = ({
  visible,
  onClose,
  toggleTheme,
  isDarkMode,
}: SettingsModalProps) => {
  const { theme } = useTheme();

  const [currentLocale, setCurrentLocale] = useState<AppLocale>(getLocale());
  const [termsVisible, setTermsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentLocale(getLocale());
    }
  }, [visible]);

  const changeLanguage = (lang: AppLocale) => {
    if (lang === currentLocale) return;
    setLocale(lang);
    setCurrentLocale(lang);
    // A escolha explícita substitui o idioma do aparelho a partir de agora.
    void updateSettings({ locale: lang });
  };

  const handleFullReset = () => {
    Alert.alert(translate('settings.reset_all'), translate('settings.confirm_reset_all'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.confirm'),
        style: 'destructive',
        onPress: () => {
          clearAllData();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={termsVisible ? () => setTermsVisible(false) : onClose}
    >
      <TouchableWithoutFeedback onPress={termsVisible ? () => setTermsVisible(false) : onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: theme.colors.modal.background,
                  borderColor: theme.colors.neon.primary,
                },
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                  {translate('settings.title')}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* SEÇÃO TEMA */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  {translate('settings.theme')}
                </Text>
                <View style={styles.row}>
                  <OptionBtn
                    label={translate('settings.light')}
                    active={!isDarkMode}
                    onPress={() => {
                      isDarkMode && toggleTheme();
                    }}
                  />
                  <OptionBtn
                    label={translate('settings.dark')}
                    active={isDarkMode}
                    onPress={() => {
                      !isDarkMode && toggleTheme();
                    }}
                  />
                </View>
              </View>

              {/* SEÇÃO IDIOMA */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                  {translate('settings.language')}
                </Text>
                <View style={styles.row}>
                  <OptionBtn
                    label={translate('settings.portuguese')}
                    active={currentLocale === 'pt-BR'}
                    onPress={() => {
                      changeLanguage('pt-BR');
                    }}
                  />
                  <OptionBtn
                    label={translate('settings.english')}
                    active={currentLocale === 'en'}
                    onPress={() => {
                      changeLanguage('en');
                    }}
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <TouchableOpacity style={styles.termsBtn} onPress={() => setTermsVisible(true)}>
                <Text style={[styles.termsText, { color: theme.colors.text.secondary }]}>
                  {translate('settings.terms_of_use')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetBtn} onPress={handleFullReset}>
                <Text style={[styles.resetText, { color: theme.colors.status.error }]}>
                  {translate('settings.reset_all')}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.versionText, { color: theme.colors.text.secondary }]}>
                {__DEV__
                  ? 'Dev Version'
                  : `${translate('settings.version')} ${VersionCheck.getCurrentVersion()}`}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {termsVisible && (
        <TouchableWithoutFeedback onPress={() => setTermsVisible(false)}>
          <View
            style={[
              styles.overlay,
              styles.termsOverlay,
              { backgroundColor: theme.colors.background.overlay },
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.container,
                  {
                    backgroundColor: theme.colors.modal.background,
                    borderColor: theme.colors.neon.primary,
                  },
                ]}
              >
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {translate('settings.terms_title')}
                  </Text>
                  <TouchableOpacity onPress={() => setTermsVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.termsBody, { color: theme.colors.text.secondary }]}>
                  {translate('settings.terms_body')}
                </Text>
                <TouchableOpacity
                  style={[styles.termsCloseBtn, { borderColor: theme.colors.neon.primary }]}
                  onPress={() => setTermsVisible(false)}
                >
                  <Text style={[styles.termsCloseBtnText, { color: theme.colors.neon.primary }]}>
                    {translate('settings.terms_close')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </Modal>
  );
};

const OptionBtn = ({ label, active, onPress }: any) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.optBtn,
        {
          backgroundColor: active ? theme.colors.home.buttonBackground : 'transparent',
          borderColor: active ? theme.colors.home.buttonBorder : theme.colors.modal.divider,
        },
      ]}
    >
      <Text
        style={[
          styles.optText,
          { color: active ? theme.colors.text.white : theme.colors.text.secondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  termsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  container: {
    width: wp('85%'),
    maxWidth: ms(500),
    padding: ms(24),
    borderRadius: ms(20),
    borderWidth: 1,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(30),
  },
  closeBtn: { padding: ms(5) },
  title: { fontFamily: 'Minecraft', fontSize: ms(18) },
  section: { marginBottom: ms(25) },
  label: { fontSize: ms(10), fontFamily: 'Minecraft', marginBottom: ms(12), opacity: 0.7 },
  row: { flexDirection: 'row', gap: ms(10) },
  optBtn: {
    flex: 1,
    paddingVertical: ms(12),
    borderRadius: ms(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  optText: { fontFamily: 'Minecraft', fontSize: ms(12) },
  divider: { height: 1, marginBottom: ms(20) },
  termsBtn: { padding: ms(12), alignItems: 'center', marginBottom: ms(5) },
  termsText: { fontFamily: 'Minecraft', fontSize: ms(11) },
  termsBody: {
    fontFamily: 'Minecraft',
    fontSize: ms(10),
    lineHeight: ms(18),
    marginBottom: ms(24),
  },
  termsCloseBtn: { borderWidth: 1, borderRadius: ms(8), padding: ms(12), alignItems: 'center' },
  termsCloseBtnText: { fontFamily: 'Minecraft', fontSize: ms(12) },
  resetBtn: { padding: ms(12), alignItems: 'center', marginBottom: ms(15) },
  resetText: { fontFamily: 'Minecraft', fontSize: ms(11) },
  versionText: { textAlign: 'center', fontSize: ms(10), fontFamily: 'Minecraft', opacity: 0.5 },
});
