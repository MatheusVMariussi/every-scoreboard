import { useState, type ReactNode } from 'react';
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
import { useTheme } from '../../theme/useTheme';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';

export interface HelpStep {
  title: string;
  content: ReactNode;
}

interface HelpModalShellProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  steps: readonly HelpStep[];
  /** Fração da largura da tela. */
  widthRatio: number;
  /** Fração da altura da tela. */
  maxHeightRatio?: number;
}

/** Guia "como jogar" em passos: cabeçalho, o passo atual e a navegação com os pontos. */
export const HelpModalShell = ({
  visible,
  onClose,
  title,
  steps,
  widthRatio,
  maxHeightRatio = 0.85,
}: HelpModalShellProps) => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [wasVisible, setWasVisible] = useState(visible);

  // Reabrir começa do primeiro passo. Ajustado no render, e não num efeito, para não
  // mostrar por um quadro o passo em que o guia foi fechado.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setStep(0);
  }

  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;
  const currentStep = steps[step];

  const handleNext = () => {
    if (isLastStep) onClose();
    else setStep(step + 1);
  };

  const handleBack = () => {
    if (!isFirstStep) setStep(step - 1);
  };

  const surface = {
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.modal.divider,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background.secondary,
              width: width * widthRatio,
              maxHeight: height * maxHeightRatio,
            },
          ]}
        >
          <View style={[styles.header, surface]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={translate('a11y.close')}
            >
              <Ionicons name="close-circle" size={ms(32)} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
              {currentStep.title}
            </Text>
            {currentStep.content}
          </ScrollView>

          <View style={[styles.footer, surface]}>
            <TouchableOpacity
              style={[styles.navBtn, isFirstStep && styles.hiddenBtn]}
              onPress={handleBack}
              disabled={isFirstStep}
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
              style={[styles.navBtn, { backgroundColor: theme.colors.text.primary }]}
              onPress={handleNext}
            >
              <Text style={[styles.navText, { color: theme.colors.text.inverse }]}>
                {isLastStep ? translate('common.got_it') : translate('common.next')}
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(16),
    borderTopWidth: 1,
  },
  navBtn: { paddingVertical: ms(10), paddingHorizontal: ms(20), borderRadius: ms(25) },
  hiddenBtn: { opacity: 0 },
  navText: { fontSize: ms(16), fontWeight: '600' },
  dots: { flexDirection: 'row', gap: ms(6) },
  dot: { width: ms(8), height: ms(8), borderRadius: ms(4) },
  activeDot: { width: ms(20) },
});
