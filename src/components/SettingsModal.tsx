import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  TouchableWithoutFeedback, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import i18n from '../i18n';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const SettingsModal = ({ visible, onClose, toggleTheme, isDarkMode }: SettingsModalProps) => {
  const { theme } = useTheme();
  
  // Estado para forçar o re-render local quando o idioma muda
  const [currentLocale, setCurrentLocale] = useState(i18n.locale);

  // Sync do estado local com o i18n global quando o modal abre
  useEffect(() => {
    if (visible) {
      setCurrentLocale(i18n.locale);
    }
  }, [visible]);

  const changeLanguage = (lang: 'pt-BR' | 'en') => {
    if (lang === i18n.locale) return;
    i18n.locale = lang;
    setCurrentLocale(lang);
  };

  const handleFullReset = () => {
    Alert.alert(
      translate('settings.reset_all'),
      translate('settings.confirm_reset_all'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        { 
          text: translate('common.confirm'),
          style: 'destructive', 
        }
      ]
    );
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        {/* Usando View normal com cor em vez de BlurView para garantir visibilidade */}
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}> 
          
          <TouchableWithoutFeedback>
            <View style={[styles.container, { 
              backgroundColor: theme.colors.modal.background, // Verifique se isso existe em dark.ts
              borderColor: theme.colors.neon.primary // Verifique se isso existe em dark.ts
            }]}>
              
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                  {translate('settings.title')}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* SEÇÃO TEMA */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('settings.theme')}</Text>
                <View style={styles.row}>
                  <OptionBtn 
                    label={translate('settings.light')}
                    active={!isDarkMode} 
                    onPress={() => isDarkMode && toggleTheme()} 
                  />
                  <OptionBtn 
                    label={translate('settings.dark')}
                    active={isDarkMode} 
                    onPress={() => !isDarkMode && toggleTheme()} 
                  />
                </View>
              </View>

              {/* SEÇÃO IDIOMA */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('settings.language')}</Text>
                <View style={styles.row}>
                  <OptionBtn 
                    label={translate('settings.portuguese')}
                    active={currentLocale.includes('pt')} 
                    onPress={() => changeLanguage('pt-BR')} 
                  />
                  <OptionBtn 
                    label={translate('settings.english')}
                    active={currentLocale.includes('en')} 
                    onPress={() => changeLanguage('en')} 
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

              <TouchableOpacity style={styles.resetBtn} onPress={handleFullReset}>
                <Text style={styles.resetText}>{translate('settings.reset_all')}</Text>
              </TouchableOpacity>

              <Text style={[styles.versionText, { color: theme.colors.text.secondary }]}>
                {translate('settings.version')} 1.0.6
              </Text>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
          borderColor: active ? theme.colors.home.buttonBorder : 'rgba(255,255,255,0.2)'
        }
      ]}
    >
      <Text style={[styles.optText, { color: active ? '#FFF' : theme.colors.text.secondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', padding: 24, borderRadius: 20, borderWidth: 1, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  closeBtn: { padding: 5 },
  title: { fontFamily: 'Minecraft', fontSize: 18 },
  section: { marginBottom: 25 },
  label: { fontSize: 10, fontFamily: 'Minecraft', marginBottom: 12, opacity: 0.7 },
  row: { flexDirection: 'row', gap: 10 },
  optBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  optText: { fontFamily: 'Minecraft', fontSize: 12 },
  divider: { height: 1, marginBottom: 20 },
  resetBtn: { padding: 12, alignItems: 'center', marginBottom: 15 },
  resetText: { color: '#FF3B30', fontFamily: 'Minecraft', fontSize: 11 },
  versionText: { textAlign: 'center', fontSize: 10, fontFamily: 'Minecraft', opacity: 0.5 }
});