import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FodinhaOutcome } from '../../hooks/useFodinhaGame';
import { translate } from '../../i18n';
import { ms, wp } from '../../theme/responsive';
import { useTheme } from '../../theme/useTheme';

interface Props {
  visible: boolean;
  outcome: FodinhaOutcome;
  /** Fecha o aviso e deixa o placar final à vista. */
  onViewBoard: () => void;
  onNewMatch: () => void;
}

const getMessage = (outcome: FodinhaOutcome): string => {
  if (outcome.status === 'won') {
    // A chave é compartilhada com o Truco, por isso o parâmetro se chama `team`.
    return translate('common.winner_text', { team: outcome.winner.name });
  }
  if (outcome.status === 'tie') {
    return translate('fodinha.tie_text', {
      names: outcome.players.map((p) => p.name).join(', '),
    });
  }
  return '';
};

/** Aviso de fim de jogo, aberto quando a rodada que fecha o jogo é finalizada. */
export const FodinhaGameOverModal = ({ visible, outcome, onViewBoard, onNewMatch }: Props) => {
  const { theme } = useTheme();
  const gold = theme.colors.truco.trophy;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onViewBoard}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
        <View
          style={[styles.card, { backgroundColor: theme.colors.voice.panel, borderColor: gold }]}
        >
          <Ionicons
            name={outcome.status === 'tie' ? 'skull' : 'trophy'}
            size={ms(40)}
            color={gold}
          />
          <Text style={[styles.title, { color: gold }]}>{translate('common.game_over')}</Text>
          <Text style={[styles.message, { color: theme.colors.text.white }]}>
            {getMessage(outcome)}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { borderColor: theme.colors.text.secondary, borderWidth: 1 }]}
              onPress={onViewBoard}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.white }]}>
                {translate('fodinha.view_board')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: gold }]}
              onPress={onNewMatch}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.black }]}>
                {translate('common.new_match').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: wp('50%'),
    maxWidth: ms(420),
    padding: ms(20),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    gap: ms(12),
  },
  title: { fontFamily: 'Minecraft', fontSize: ms(16), textAlign: 'center' },
  message: { fontFamily: 'Minecraft', fontSize: ms(11), lineHeight: ms(18), textAlign: 'center' },
  actions: { flexDirection: 'row', gap: ms(12), marginTop: ms(4), alignSelf: 'stretch' },
  button: {
    flex: 1,
    paddingVertical: ms(10),
    paddingHorizontal: ms(8),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: 'Minecraft', fontSize: ms(11), textAlign: 'center' },
});
