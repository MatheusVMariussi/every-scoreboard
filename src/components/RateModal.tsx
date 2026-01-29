import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Linking, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface RateModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RateModal = ({ visible, onClose }: RateModalProps) => {
  const { theme } = useTheme();

  const handleOpenStore = () => {
    if (Platform.OS === 'android') {
      // Abre direto a página do seu app na Play Store usando o package name do seu app.json
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
      {/* Fundo Escuro (Clica fora para fechar) */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          
          {/* Conteúdo do Modal (Impede que o clique feche o modal) */}
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.brand.primary }]}>

              {/* Header com X */}
              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialCommunityIcons name="diamond-stone" size={24} color={theme.colors.neon.secondary} />
                    <Text style={[styles.title, { color: theme.colors.text.primary }]}>{translate('rateModal.rate_title')}</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Mensagem */}
              <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
                {translate('rateModal.rate_message')}
              </Text>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              {/* Botões */}
              <View style={styles.actionsColumn}>
                
                {/* Botão 1: Loja */}
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.brand.primary }]}
                    onPress={handleOpenStore}
                >
                    <Ionicons name="star" size={18} color={theme.colors.text.white} style={{ marginRight: 8 }} />
                    <Text style={[styles.actionText, { color: theme.colors.text.white }]}>
                        {translate('rateModal.rate_now')}
                    </Text>
                </TouchableOpacity>

                {/* Botão 2: Site/Contato */}
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.colors.text.secondary, borderWidth: 1 }]}
                    onPress={handleOpenPortfolio}
                >
                    <Ionicons name="globe-outline" size={18} color={theme.colors.text.primary} style={{ marginRight: 8 }} />
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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '90%', maxWidth: 400, padding: 24, borderRadius: 20, borderWidth: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'Minecraft', fontSize: 18 },
  message: { fontFamily: 'Minecraft', fontSize: 14, lineHeight: 22, textAlign: 'left', marginBottom: 10 },
  divider: { height: 1, marginVertical: 20 },
  actionsColumn: { gap: 12 },
  actionBtn: { flexDirection: 'row', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Minecraft', fontSize: 14 }
});