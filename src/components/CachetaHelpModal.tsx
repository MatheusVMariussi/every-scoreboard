import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';

interface CachetaHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const ActionDisplay = ({
  label,
  color,
  points,
  theme,
}: {
  label: string;
  color: string;
  points: string;
  theme: any;
}) => (
  <View style={styles.actionItem}>
    <View style={[styles.circle, { borderColor: color }]}>
      <Text style={[styles.circleText, { color: color }]}>{label}</Text>
    </View>
    <Ionicons name="arrow-forward" size={ms(20)} color={theme.colors.text.secondary} />
    <Text
      style={[
        styles.pointsText,
        { color: points === '0' ? theme.colors.status.success : theme.colors.status.error },
      ]}
    >
      {points}
    </Text>
  </View>
);

const Card = ({
  value,
  suit,
  highlight = false,
}: {
  value: string;
  suit: string;
  highlight?: boolean;
}) => (
  <View style={[styles.card, highlight && styles.cardHighlight]}>
    <Text style={[styles.cardValue, { color: suit === '♥' || suit === '♦' ? '#D32F2F' : 'black' }]}>
      {value}
    </Text>
    <Text style={[styles.cardSuit, { color: suit === '♥' || suit === '♦' ? '#D32F2F' : 'black' }]}>
      {suit}
    </Text>
  </View>
);

export const CachetaHelpModal = ({ visible, onClose }: CachetaHelpModalProps) => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: translate('cacheta.help.objective_title'),
      content: (
        <View style={styles.stepContainerRow}>
          <View style={styles.iconColumn}>
            <Ionicons
              name="shield-checkmark-outline"
              size={ms(80)}
              color={theme.colors.brand.primary}
            />
          </View>
          <View style={styles.textColumn}>
            <Text style={[styles.text, { color: theme.colors.text.primary }]}>
              {translate('cacheta.help.objective_text')}
            </Text>
          </View>
        </View>
      ),
    },
    {
      title: translate('cacheta.help.hands_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={[styles.text, { color: theme.colors.text.primary, marginBottom: ms(20) }]}>
            {translate('cacheta.help.hands_text')}
          </Text>

          <View style={styles.handsRow}>
            {/* Column 1: Sets */}
            <View style={styles.handColumn}>
              <Text style={[styles.subTitle, { color: theme.colors.text.primary }]}>
                {translate('cacheta.help.sets_title')}
              </Text>
              <Text style={[styles.subText, { color: theme.colors.text.secondary }]}>
                {translate('cacheta.help.sets_text')}
              </Text>
              <View style={styles.cardsRow}>
                <Card value="7" suit="♥" />
                <Card value="7" suit="♣" />
                <Card value="7" suit="♠" />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.verticalDivider} />

            {/* Column 2: Runs */}
            <View style={styles.handColumn}>
              <Text style={[styles.subTitle, { color: theme.colors.text.primary }]}>
                {translate('cacheta.help.runs_title')}
              </Text>
              <Text style={[styles.subText, { color: theme.colors.text.secondary }]}>
                {translate('cacheta.help.runs_text')}
              </Text>
              <View style={styles.cardsRow}>
                <Card value="4" suit="♦" />
                <Card value="5" suit="♦" />
                <Card value="6" suit="♦" />
              </View>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: translate('cacheta.help.scoring_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={[styles.text, { color: theme.colors.text.primary, marginBottom: ms(20) }]}>
            {translate('cacheta.help.scoring_text')}
          </Text>

          <View style={styles.scoringGrid}>
            <View style={styles.scoringItem}>
              <Text style={[styles.scoringLabel, { color: theme.colors.cacheta.win }]}>
                {translate('cacheta.help.won_title')}
              </Text>
              <ActionDisplay
                label={translate('cacheta.actions.won')}
                color={theme.colors.cacheta.win}
                points="0"
                theme={theme}
              />
              <Text style={[styles.scoringDesc, { color: theme.colors.text.secondary }]}>
                {translate('cacheta.help.won_text')}
              </Text>
            </View>

            <View style={styles.scoringItem}>
              <Text style={[styles.scoringLabel, { color: theme.colors.cacheta.fold }]}>
                {translate('cacheta.help.fold_title')}
              </Text>
              <ActionDisplay
                label={translate('cacheta.actions.fold')}
                color={theme.colors.cacheta.fold}
                points="-1"
                theme={theme}
              />
              <Text style={[styles.scoringDesc, { color: theme.colors.text.secondary }]}>
                {translate('cacheta.help.fold_text')}
              </Text>
            </View>

            <View style={styles.scoringItem}>
              <Text style={[styles.scoringLabel, { color: theme.colors.cacheta.loss }]}>
                {translate('cacheta.help.lost_title')}
              </Text>
              <ActionDisplay
                label={translate('cacheta.actions.lost')}
                color={theme.colors.cacheta.loss}
                points="-2"
                theme={theme}
              />
              <Text style={[styles.scoringDesc, { color: theme.colors.text.secondary }]}>
                {translate('cacheta.help.lost_text')}
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: translate('cacheta.help.elimination_title'),
      content: (
        <View style={styles.stepContainerRow}>
          <View style={styles.iconColumn}>
            <Ionicons name="skull-outline" size={ms(80)} color={theme.colors.status.error} />
          </View>
          <View style={styles.textColumn}>
            <Text style={[styles.text, { color: theme.colors.text.primary }]}>
              {translate('cacheta.help.elimination_text')}
            </Text>

            <View style={styles.exampleBox}>
              <Text style={[styles.exampleText, { color: theme.colors.text.secondary }]}>
                10 Pts
              </Text>
              <Ionicons name="arrow-forward" size={ms(16)} color={theme.colors.text.secondary} />
              <Text style={[styles.exampleText, { color: theme.colors.status.error }]}>0 Pts</Text>
              <Ionicons name="arrow-forward" size={ms(16)} color={theme.colors.text.secondary} />
              <Text style={[styles.eliminatedText, { color: theme.colors.status.error }]}>
                {translate('cacheta.out_of_game')}
              </Text>
            </View>
          </View>
        </View>
      ),
    },
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
      supportedOrientations={['landscape', 'portrait']}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background.secondary,
              width: width * 0.7,
              maxHeight: height * 0.85,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: theme.colors.modal.divider,
                backgroundColor: theme.colors.background.secondary,
              },
            ]}
          >
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              {translate('cacheta.help.title')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={ms(32)} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
              {steps[step].title}
            </Text>
            {steps[step].content}
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.colors.modal.divider,
                backgroundColor: theme.colors.background.secondary,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.navBtn, step === 0 && styles.disabledBtn]}
              onPress={handleBack}
              disabled={step === 0}
            >
              <Text style={[styles.navText, { color: theme.colors.text.primary }]}>
                {translate('common.previous')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dots}>
              {steps.map((stepItem, i) => (
                <View
                  key={`step-${stepItem.title}`}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === step ? theme.colors.text.primary : theme.colors.text.secondary,
                    },
                    i === step && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.primaryBtn,
                { backgroundColor: theme.colors.text.primary },
              ]}
              onPress={handleNext}
            >
              <Text
                style={[styles.navText, styles.primaryText, { color: theme.colors.text.inverse }]}
              >
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
  container: { borderRadius: ms(16), overflow: 'hidden', elevation: 5 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(16),
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: ms(20), fontWeight: 'bold' },
  scrollContent: { padding: ms(20) },
  stepTitle: { fontSize: ms(22), fontWeight: 'bold', marginBottom: ms(20), textAlign: 'center' },
  stepContainer: { alignItems: 'center' },

  // Row Layout Steps (Objective / Elimination)
  stepContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(20),
    paddingHorizontal: ms(20),
  },
  iconColumn: { width: '30%', alignItems: 'center' },
  textColumn: { width: '70%' },
  text: { fontSize: ms(16), lineHeight: ms(24), textAlign: 'center' },

  // Hands Grid
  handsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  handColumn: { flex: 1, alignItems: 'center', paddingHorizontal: ms(5) },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    height: '100%',
    marginHorizontal: ms(10),
  },

  subTitle: { fontSize: ms(16), fontWeight: 'bold', marginBottom: ms(5) },
  subText: {
    fontSize: ms(13),
    marginBottom: ms(10),
    textAlign: 'center',
    fontStyle: 'italic',
    minHeight: ms(40),
  },
  cardsRow: { flexDirection: 'row', gap: ms(8), marginBottom: ms(10) },

  // Scoring Grid
  scoringGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  scoringItem: { flex: 1, alignItems: 'center', paddingHorizontal: ms(5) },
  scoringLabel: { fontSize: ms(16), fontWeight: 'bold', marginBottom: ms(5) },
  scoringDesc: { fontSize: ms(13), textAlign: 'center', marginTop: ms(5) },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: ms(5), marginVertical: ms(5) },
  pointsText: { fontSize: ms(24), fontWeight: 'bold', fontFamily: 'Minecraft' },

  // Elimination
  exampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginTop: ms(15),
    padding: ms(10),
    borderRadius: ms(10),
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
  },
  exampleText: { fontSize: ms(16), fontWeight: 'bold', fontFamily: 'Minecraft' },
  eliminatedText: { fontSize: ms(16), fontWeight: 'bold', fontFamily: 'Minecraft' },

  // Circle Component
  circle: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: { fontFamily: 'Minecraft', fontSize: ms(14), fontWeight: 'bold' },

  // Card
  card: {
    width: ms(40),
    height: ms(56),
    backgroundColor: '#FFF',
    borderRadius: ms(4),
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  cardHighlight: { borderColor: '#333', borderWidth: 1.5 },
  cardValue: { fontSize: ms(16), fontWeight: 'bold' },
  cardSuit: { fontSize: ms(14) },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(16),
    borderTopWidth: 1,
  },
  navBtn: { paddingVertical: ms(10), paddingHorizontal: ms(20), borderRadius: ms(25) },
  primaryBtn: {},
  disabledBtn: { opacity: 0 },
  navText: { fontSize: ms(16), fontWeight: '600' },
  primaryText: {},
  dots: { flexDirection: 'row', gap: ms(6) },
  dot: { width: ms(8), height: ms(8), borderRadius: ms(4) },
  activeDot: { width: ms(20) },
});
