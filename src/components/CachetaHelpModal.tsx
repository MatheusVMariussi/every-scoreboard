import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface CachetaHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const ActionDisplay = ({ label, color, points, theme }: { label: string, color: string, points: string, theme: any }) => (
  <View style={styles.actionItem}>
    <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.circleText, { color: color }]}>{label}</Text>
    </View>
    <Ionicons name="arrow-forward" size={20} color={theme.colors.text.secondary} />
    <Text style={[styles.pointsText, { color: points === '0' ? theme.colors.status.success : theme.colors.status.error }]}>
        {points}
    </Text>
  </View>
);

export const CachetaHelpModal = ({ visible, onClose }: CachetaHelpModalProps) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: translate('cacheta.help.objective_title'),
      content: (
        <View style={styles.stepContainer}>
          <Ionicons name="shield-checkmark-outline" size={60} color={theme.colors.brand.primary} style={{ marginBottom: 20 }} />
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            {translate('cacheta.help.objective_text')}
          </Text>
        </View>
      )
    },
    {
      title: translate('cacheta.help.scoring_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            {translate('cacheta.help.scoring_text')}
          </Text>

          <View style={styles.scoringList}>
              <View style={styles.scoringRow}>
                  <Text style={[styles.scoringLabel, { color: theme.colors.cacheta.win }]}>{translate('cacheta.help.won_title')}</Text>
                  <ActionDisplay
                    label={translate('cacheta.actions.won')}
                    color={theme.colors.cacheta.win}
                    points="0"
                    theme={theme}
                  />
                  <Text style={[styles.scoringDesc, { color: theme.colors.text.secondary }]}>{translate('cacheta.help.won_text')}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.scoringRow}>
                  <Text style={[styles.scoringLabel, { color: theme.colors.cacheta.fold }]}>{translate('cacheta.help.fold_title')}</Text>
                  <ActionDisplay
                    label={translate('cacheta.actions.fold')}
                    color={theme.colors.cacheta.fold}
                    points="-1"
                    theme={theme}
                  />
                  <Text style={[styles.scoringDesc, { color: theme.colors.text.secondary }]}>{translate('cacheta.help.fold_text')}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.scoringRow}>
                  <Text style={[styles.scoringLabel, { color: theme.colors.cacheta.loss }]}>{translate('cacheta.help.lost_title')}</Text>
                  <ActionDisplay
                    label={translate('cacheta.actions.lost')}
                    color={theme.colors.cacheta.loss}
                    points="-2"
                    theme={theme}
                  />
                  <Text style={[styles.scoringDesc, { color: theme.colors.text.secondary }]}>{translate('cacheta.help.lost_text')}</Text>
              </View>
          </View>
        </View>
      )
    },
    {
      title: translate('cacheta.help.elimination_title'),
      content: (
        <View style={styles.stepContainer}>
           <Ionicons name="skull-outline" size={60} color={theme.colors.status.error} style={{ marginBottom: 20 }} />
           <Text style={[styles.text, { color: theme.colors.text.primary }]}>
             {translate('cacheta.help.elimination_text')}
           </Text>

           <View style={styles.exampleBox}>
               <Text style={[styles.exampleText, { color: theme.colors.text.secondary }]}>Ex: 10 Pts</Text>
               <Ionicons name="arrow-forward" size={16} color={theme.colors.text.secondary} />
               <Text style={[styles.exampleText, { color: theme.colors.status.error }]}>0 Pts</Text>
               <Ionicons name="arrow-forward" size={16} color={theme.colors.text.secondary} />
               <Text style={[styles.eliminatedText, { color: theme.colors.status.error }]}>{translate('cacheta.out_of_game')}</Text>
           </View>
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
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>{translate('cacheta.help.title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={32} color={theme.colors.text.primary} />
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
                {steps.map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: i === step ? theme.colors.text.primary : theme.colors.text.secondary }, i === step && styles.activeDot]} />
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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxHeight: '85%', borderRadius: 16, overflow: 'hidden', elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  stepContainer: { alignItems: 'center' },
  text: { fontSize: 16, lineHeight: 24, marginBottom: 15, textAlign: 'center' },

  // Scoring
  scoringList: { width: '100%', marginTop: 10 },
  scoringRow: { alignItems: 'center', marginBottom: 10 },
  scoringLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  scoringDesc: { fontSize: 14, textAlign: 'center', marginTop: 5 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 5 },
  pointsText: { fontSize: 24, fontWeight: 'bold', fontFamily: 'Minecraft' },
  divider: { height: 1, backgroundColor: '#E0E0E0', width: '50%', alignSelf: 'center', marginVertical: 10 },

  // Elimination
  exampleBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, padding: 15, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  exampleText: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Minecraft' },
  eliminatedText: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Minecraft' },

  // Circle Component
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  circleText: { fontFamily: 'Minecraft', fontSize: 14, fontWeight: 'bold' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1 },
  navBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  primaryBtn: { },
  disabledBtn: { opacity: 0 },
  navText: { fontSize: 16, fontWeight: '600' },
  primaryText: { },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDot: { width: 20 }
});
