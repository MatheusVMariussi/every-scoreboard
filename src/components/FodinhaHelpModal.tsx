import { View, StyleSheet } from 'react-native';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';
import { HelpModalShell, type HelpStep } from './help/HelpModalShell';
import { HelpCallout, HelpLabel, HelpSplit, HelpText } from './help/HelpLayout';
import {
  BetExample,
  CancelOutExample,
  CardRanking,
  LivesExample,
  PenaltyTable,
  SuitOrder,
} from './fodinha/help/FodinhaHelpVisuals';

interface FodinhaHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Cada passo cabe numa tela de celular deitado sem rolar: um exemplo desenhado como o
 * placar e pouco texto. A anulação tem passo próprio porque é uma variante, que troca o
 * desempate por naipe do passo das cartas.
 */
export const FodinhaHelpModal = ({ visible, onClose }: FodinhaHelpModalProps) => {
  const steps: HelpStep[] = [
    {
      title: translate('fodinha.help.objective_title'),
      content: (
        <HelpSplit visual={<LivesExample />}>
          <HelpText>{translate('fodinha.help.objective_text')}</HelpText>
          <HelpCallout>{translate('fodinha.help.objective_note')}</HelpCallout>
        </HelpSplit>
      ),
    },
    {
      title: translate('fodinha.help.betting_title'),
      content: (
        <HelpSplit visual={<BetExample />}>
          <HelpText>{translate('fodinha.help.betting_text')}</HelpText>
          <HelpCallout>{translate('fodinha.help.betting_rule_text')}</HelpCallout>
        </HelpSplit>
      ),
    },
    {
      title: translate('fodinha.help.scoring_title'),
      content: (
        <View style={styles.stack}>
          <HelpText center>{translate('fodinha.help.scoring_text')}</HelpText>
          <PenaltyTable />
          <HelpText muted center>
            {translate('fodinha.help.scoring_note')}
          </HelpText>
        </View>
      ),
    },
    {
      title: translate('fodinha.help.cards_title'),
      content: (
        <View style={styles.stack}>
          <HelpText center>{translate('fodinha.help.cards_text')}</HelpText>
          <CardRanking />
          <View style={styles.tieRow}>
            <HelpLabel>{translate('fodinha.help.cards_suit_title')}</HelpLabel>
            <View style={styles.tieText}>
              <HelpText muted>{translate('fodinha.help.cards_suit_text')}</HelpText>
            </View>
            <SuitOrder />
          </View>
        </View>
      ),
    },
    {
      title: translate('fodinha.help.cancel_title'),
      content: (
        <HelpSplit visual={<CancelOutExample />}>
          <HelpText>{translate('fodinha.help.cancel_text')}</HelpText>
          <HelpText muted>{translate('fodinha.help.cancel_double')}</HelpText>
        </HelpSplit>
      ),
    },
  ];

  return (
    <HelpModalShell
      visible={visible}
      onClose={onClose}
      title={translate('fodinha.help.title')}
      steps={steps}
      widthRatio={0.72}
      maxHeightRatio={0.9}
      fixedHeight
    />
  );
};

const styles = StyleSheet.create({
  stack: { gap: ms(14) },
  tieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(12) },
  tieText: { flexShrink: 1 },
});
