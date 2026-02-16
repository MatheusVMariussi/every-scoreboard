import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms, wp } from '../theme/responsive';

interface FodinhaHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const Card = ({ value, suit, highlight = false }: { value: string, suit: string, highlight?: boolean }) => (
  <View style={[styles.card, highlight && styles.cardHighlight]}>
    <Text style={[styles.cardValue, { color: suit === '♥' || suit === '♦' ? '#D32F2F' : 'black' }]}>{value}</Text>
    <Text style={[styles.cardSuit, { color: suit === '♥' || suit === '♦' ? '#D32F2F' : 'black' }]}>{suit}</Text>
  </View>
);

export const FodinhaHelpModal = ({ visible, onClose }: FodinhaHelpModalProps) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: translate('fodinha.help.objective_title'),
      content: (
        <View style={styles.stepContainerRow}>
          <View style={styles.iconColumn}>
            <Ionicons name="heart-dislike-outline" size={ms(80)} color={theme.colors.status.error} />
          </View>
          <View style={styles.textColumn}>
            <Text style={[styles.text, { color: theme.colors.text.primary }]}>
              {translate('fodinha.help.objective_text')}
            </Text>
          </View>
        </View>
      )
    },
    {
      title: translate('fodinha.help.betting_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={[styles.text, { color: theme.colors.text.primary, marginBottom: ms(20) }]}>
            {translate('fodinha.help.betting_text')}
          </Text>

          <View style={[styles.alertBox, { backgroundColor: 'rgba(255, 152, 0, 0.1)', borderColor: 'rgba(255, 152, 0, 0.5)' }]}>
             <View style={styles.alertHeader}>
                <Ionicons name="warning" size={ms(24)} color="#F57C00" />
                <Text style={[styles.alertTitle, { color: '#F57C00' }]}>{translate('fodinha.help.betting_rule_title')}</Text>
             </View>
             <Text style={[styles.alertText, { color: theme.colors.text.primary }]}>
                {translate('fodinha.help.betting_rule_text')}
             </Text>
             <Text style={[styles.alertNote, { color: theme.colors.text.secondary }]}>
                {translate('fodinha.help.betting_rule_note')}
             </Text>
          </View>
        </View>
      )
    },
    {
      title: translate('fodinha.help.scoring_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={[styles.text, { color: theme.colors.text.primary, marginBottom: ms(20) }]}>
            {translate('fodinha.help.scoring_text')}
          </Text>

          <View style={styles.scoringRow}>
              {/* Hit */}
              <View style={[styles.scoringCard, { backgroundColor: theme.colors.background.overlay }]}>
                  <Ionicons name="checkmark-circle" size={ms(40)} color={theme.colors.status.success} style={{ marginBottom: ms(10) }} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>{translate('fodinha.help.hit_title')}</Text>
                  <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{translate('fodinha.help.hit_text')}</Text>
              </View>

              {/* Miss */}
              <View style={[styles.scoringCard, { backgroundColor: theme.colors.background.overlay }]}>
                  <Ionicons name="close-circle" size={ms(40)} color={theme.colors.status.error} style={{ marginBottom: ms(10) }} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>{translate('fodinha.help.miss_title')}</Text>
                  <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{translate('fodinha.help.miss_text')}</Text>
              </View>
          </View>

          <View style={styles.penaltyRow}>
             <View style={styles.penaltyItem}>
                <Text style={[styles.penaltyTitle, { color: theme.colors.text.primary }]}>{translate('fodinha.help.penalty_fixed_title')}</Text>
                <Text style={[styles.penaltyText, { color: theme.colors.text.secondary }]}>{translate('fodinha.help.penalty_fixed_text')}</Text>
             </View>
             <View style={[styles.verticalDivider, { backgroundColor: theme.colors.modal.divider }]} />
             <View style={styles.penaltyItem}>
                <Text style={[styles.penaltyTitle, { color: theme.colors.text.primary }]}>{translate('fodinha.help.penalty_diff_title')}</Text>
                <Text style={[styles.penaltyText, { color: theme.colors.text.secondary }]}>{translate('fodinha.help.penalty_diff_text')}</Text>
             </View>
          </View>
        </View>
      )
    },
    {
      title: translate('fodinha.help.cards_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            {translate('fodinha.help.cards_text')}
          </Text>

          <View style={styles.cardsRow}>
            <Card value="3" suit="♣" highlight />
            <Card value="2" suit="♦" />
            <Card value="A" suit="♠" />
            <Card value="K" suit="♥" />
            <Card value="J" suit="♣" />
          </View>
          <View style={styles.cardsRow}>
            <Card value="Q" suit="♦" />
            <Card value="7" suit="♠" />
            <Card value="6" suit="♥" />
            <Card value="5" suit="♣" />
            <Card value="4" suit="♦" />
          </View>

          <View style={{ width: '100%', height: 1, backgroundColor: theme.colors.modal.divider, marginVertical: ms(15) }} />

          <Text style={[styles.subTitle, { color: theme.colors.text.primary }]}>{translate('fodinha.help.cards_suit_title')}</Text>
          <Text style={[styles.text, { color: theme.colors.text.secondary, marginBottom: ms(10) }]}>{translate('fodinha.help.cards_suit_text')}</Text>

          <View style={styles.suitsRow}>
             <View style={styles.suitItem}><Text style={[styles.suitText, { color: '#D32F2F' }]}>♦</Text></View>
             <Ionicons name="chevron-forward" size={ms(20)} color={theme.colors.text.secondary} />
             <View style={styles.suitItem}><Text style={[styles.suitText, { color: 'black' }]}>♠</Text></View>
             <Ionicons name="chevron-forward" size={ms(20)} color={theme.colors.text.secondary} />
             <View style={styles.suitItem}><Text style={[styles.suitText, { color: '#D32F2F' }]}>♥</Text></View>
             <Ionicons name="chevron-forward" size={ms(20)} color={theme.colors.text.secondary} />
             <View style={styles.suitItem}><Text style={[styles.suitText, { color: 'black' }]}>♣</Text></View>
          </View>

          <Text style={[styles.subTitle, { color: theme.colors.text.primary }]}>{translate('fodinha.help.cards_suit_title_cancelOut')}</Text>
          <Text style={[styles.text, { color: theme.colors.text.secondary, marginBottom: ms(10) }]}>{translate('fodinha.help.cards_suit_text_cancelOut')}</Text>

        </View>
      )
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onClose();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={['landscape']}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.modal.divider, backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>{translate('fodinha.help.title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={ms(32)} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
             <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>{steps[step].title}</Text>
             {steps[step].content}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.modal.divider, backgroundColor: theme.colors.background.secondary }]}>
             <TouchableOpacity
                style={[styles.navBtn, step === 0 && styles.disabledBtn]}
                onPress={handleBack}
                disabled={step === 0}
             >
                <Text style={[styles.navText, { color: theme.colors.text.primary }]}>{translate('common.previous')}</Text>
             </TouchableOpacity>

             <View style={styles.dots}>
                {steps.map((stepItem, i) => (
                    <View key={`step-${stepItem.title}`} style={[styles.dot, { backgroundColor: i === step ? theme.colors.text.primary : theme.colors.text.secondary }, i === step && styles.activeDot]} />
                ))}
             </View>

             <TouchableOpacity style={[styles.navBtn, styles.primaryBtn, { backgroundColor: theme.colors.text.primary }]} onPress={handleNext}>
                <Text style={[styles.navText, styles.primaryText, { color: theme.colors.text.inverse }]}>
                    {step === steps.length - 1 ? translate('common.got_it') : translate('common.next')}
                </Text>
             </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: ms(20) },
  container: { width: wp('85%'), maxHeight: '90%', borderRadius: ms(16), overflow: 'hidden', elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ms(16), borderBottomWidth: 1 },
  headerTitle: { fontSize: ms(20), fontWeight: 'bold' },
  scrollContent: { padding: ms(20) },
  stepTitle: { fontSize: ms(22), fontWeight: 'bold', marginBottom: ms(20), textAlign: 'center' },
  stepContainer: { alignItems: 'center' },

  // Row Layout
  stepContainerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(20), paddingHorizontal: ms(20) },
  iconColumn: { width: '30%', alignItems: 'center' },
  textColumn: { width: '70%' },
  text: { fontSize: ms(16), lineHeight: ms(24), textAlign: 'center' },

  // Betting Rule Alert
  alertBox: { width: '80%', padding: ms(15), borderRadius: ms(10), borderWidth: 1, marginTop: ms(10) },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: ms(10), marginBottom: ms(10), justifyContent: 'center' },
  alertTitle: { fontSize: ms(18), fontWeight: 'bold' },
  alertText: { fontSize: ms(15), lineHeight: ms(22), textAlign: 'center', fontWeight: '500' },
  alertNote: { fontSize: ms(13), marginTop: ms(10), textAlign: 'center', fontStyle: 'italic' },

  // Scoring Grid
  scoringRow: { flexDirection: 'row', width: '100%', gap: ms(15), justifyContent: 'center', marginBottom: ms(20) },
  scoringCard: { flex: 1, padding: ms(15), borderRadius: ms(10), alignItems: 'center' },
  cardTitle: { fontSize: ms(16), fontWeight: 'bold', marginBottom: ms(5) },
  cardText: { fontSize: ms(13), textAlign: 'center' },

  // Penalties
  penaltyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '90%', marginTop: ms(10) },
  penaltyItem: { flex: 1, alignItems: 'center', paddingHorizontal: ms(10) },
  verticalDivider: { width: 1, height: '80%', marginHorizontal: ms(10) },
  penaltyTitle: { fontSize: ms(14), fontWeight: 'bold', marginBottom: ms(5) },
  penaltyText: { fontSize: ms(12), textAlign: 'center' },

  // Cards Step
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: ms(8), marginTop: ms(15) },
  card: { width: ms(44), height: ms(60), backgroundColor: '#FFF', borderRadius: ms(4), borderWidth: 1, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  cardHighlight: { borderColor: '#333', borderWidth: 1.5 },
  cardValue: { fontSize: ms(18), fontWeight: 'bold' },
  cardSuit: { fontSize: ms(16) },

  subTitle: { fontSize: ms(18), fontWeight: 'bold', marginBottom: ms(8) },
  suitsRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10), justifyContent: 'center' },
  suitItem: { width: ms(36), height: ms(36), justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: ms(18), elevation: 1, borderWidth: 1, borderColor: '#EEE' },
  suitText: { fontSize: ms(20), fontWeight: 'bold' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ms(16), borderTopWidth: 1 },
  navBtn: { paddingVertical: ms(10), paddingHorizontal: ms(20), borderRadius: ms(25) },
  primaryBtn: { },
  disabledBtn: { opacity: 0 },
  navText: { fontSize: ms(16), fontWeight: '600' },
  primaryText: { },
  dots: { flexDirection: 'row', gap: ms(6) },
  dot: { width: ms(8), height: ms(8), borderRadius: ms(4) },
  activeDot: { width: ms(20) }
});
