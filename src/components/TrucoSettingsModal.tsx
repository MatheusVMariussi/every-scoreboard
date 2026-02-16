import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { Ionicons } from '@expo/vector-icons';
import { ms, wp } from '../theme/responsive';

interface TrucoSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
  gameMode: 'paulista' | 'mineiro';
  setGameMode: (mode: 'paulista' | 'mineiro') => void;
  maxScore: number;
  setMaxScore: (score: number) => void;
}

export const TrucoSettingsModal = ({
  visible, onClose, onReset, onOpenHelp,
  gameMode, setGameMode,
  maxScore, setMaxScore
}: TrucoSettingsModalProps) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.truco.scoreText }]}>

              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{translate('settings.title')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* MODO DE JOGO */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('truco.game_mode')}</Text>
                <View style={styles.row}>
                  <OptionBtn
                    label={translate('truco.paulista').toUpperCase()}
                    active={gameMode === 'paulista'}
                    onPress={() => setGameMode('paulista')}
                    theme={theme}
                  />
                  <OptionBtn
                    label={translate('truco.mineiro').toUpperCase()}
                    active={gameMode === 'mineiro'}
                    onPress={() => setGameMode('mineiro')}
                    theme={theme}
                  />
                </View>
              </View>

              {/* PONTUAÇÃO MÁXIMA */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{translate('truco.max_score')}</Text>
                <View style={styles.row}>
                  <OptionBtn
                    label={translate('common.points_12')}
                    active={maxScore === 12}
                    onPress={() => setMaxScore(12)}
                    theme={theme}
                  />
                  <OptionBtn
                    label={translate('common.points_24')}
                    active={maxScore === 24}
                    onPress={() => setMaxScore(24)}
                    theme={theme}
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.modal.divider }]} />

              <View style={styles.actionsRow}>
                  <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: theme.colors.text.secondary, borderWidth: 1 }]}
                      onPress={onOpenHelp}
                  >
                      <Ionicons name="book-outline" size={ms(20)} color={theme.colors.text.primary} style={{ marginRight: ms(8) }} />
                      <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>
                          {translate('common.how_to_play')}
                      </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.colors.status.error }]}
                      onPress={() => { onReset(); onClose(); }}
                  >
                      <Text style={[styles.actionText, { color: theme.colors.text.white }]}>
                          {translate('common.reset_match')}
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

const OptionBtn = ({ label, active, onPress, theme }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.optBtn,
      {
        backgroundColor: active ? theme.colors.brand.primary : 'transparent',
        borderColor: active ? theme.colors.brand.primary : theme.colors.text.secondary
      }
    ]}
  >
    <Text style={[styles.optText, { color: active ? theme.colors.text.white : theme.colors.text.secondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { width: wp('85%'), maxWidth: ms(500), padding: ms(24), borderRadius: ms(20), borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(25) },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  infoBtn: { marginLeft: ms(10) },
  title: { fontFamily: 'Minecraft', fontSize: ms(18) },
  section: { marginBottom: ms(20) },
  label: { fontSize: ms(10), fontFamily: 'Minecraft', marginBottom: ms(10), opacity: 0.7 },
  row: { flexDirection: 'row', gap: ms(10) },
  optBtn: { flex: 1, paddingVertical: ms(12), borderRadius: ms(8), borderWidth: 1, alignItems: 'center' },
  optText: { fontFamily: 'Minecraft', fontSize: ms(12) },
  divider: { height: 1, marginVertical: ms(15) },
  actionsRow: { gap: ms(10) },
  actionBtn: { flexDirection: 'row', padding: ms(15), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Minecraft', fontSize: ms(14) }
});
