import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FodinhaOutcome } from '../../hooks/useFodinhaGame';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';
import { useTheme } from '../../theme/useTheme';
import { oneWordPerLine } from '../../utils/text';

interface Props {
  visible: boolean;
  outcome: FodinhaOutcome;
  /** Fecha o aviso e deixa o placar final à vista. */
  onViewBoard: () => void;
  onNewMatch: () => void;
}

/**
 * Largura do cartão medida no render, não no `StyleSheet`: um `wp()` estático é avaliado
 * ao importar o módulo, ainda em retrato, e em paisagem o cartão ficava estreito demais.
 */
const CARD_WIDTH_RATIO = 0.85;
const CARD_MAX_WIDTH = ms(520);

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
  const { width } = useWindowDimensions();
  const gold = theme.colors.truco.trophy;
  const cardWidth = Math.min(width * CARD_WIDTH_RATIO, CARD_MAX_WIDTH);

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
          style={[
            styles.card,
            { width: cardWidth, backgroundColor: theme.colors.voice.panel, borderColor: gold },
          ]}
        >
          <Ionicons
            name={outcome.status === 'tie' ? 'skull' : 'trophy'}
            size={ms(48)}
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
                {oneWordPerLine(translate('fodinha.view_board'))}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: gold }]}
              onPress={onNewMatch}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.black }]}>
                {oneWordPerLine(translate('common.new_match').toUpperCase())}
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
    padding: ms(24),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    gap: ms(14),
  },
  title: { fontFamily: 'Minecraft', fontSize: ms(20), lineHeight: ms(28), textAlign: 'center' },
  message: { fontFamily: 'Minecraft', fontSize: ms(13), lineHeight: ms(21), textAlign: 'center' },
  actions: { flexDirection: 'row', gap: ms(14), marginTop: ms(4), alignSelf: 'stretch' },
  button: {
    flex: 1,
    paddingVertical: ms(14),
    paddingHorizontal: ms(10),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Minecraft',
    fontSize: ms(14),
    lineHeight: ms(22),
    textAlign: 'center',
  },
});
