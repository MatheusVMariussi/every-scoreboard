import { useRef, useState, type ReactNode } from 'react';
import {
  Animated,
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
  /** Nome do guia, acima do título do passo. */
  title: string;
  steps: readonly HelpStep[];
  /** Fração da largura da tela. */
  widthRatio: number;
  /** Fração da altura da tela: limite do cartão, ou a altura dele com `fixedHeight`. */
  maxHeightRatio?: number;
  /**
   * Cartão com a mesma altura em todos os passos e o conteúdo centralizado, para não pular
   * de tamanho na troca. Para guias cujos passos cabem sem rolar; sem isso, o cartão
   * acompanha o conteúdo até o limite.
   */
  fixedHeight?: boolean;
}

/** Troca de passo: o conteúdo novo aparece num fade curto, sem deslocamento. */
const STEP_FADE_MS = 160;
const CLOSE_HIT_SLOP = { top: ms(10), bottom: ms(10), left: ms(10), right: ms(10) };
/** Os botões do rodapé são baixos para a paisagem; o hitSlop leva o toque a 44pt. */
const NAV_HIT_SLOP = { top: ms(6), bottom: ms(6) };

/**
 * Guia "como jogar" em passos. Mesma moldura das configurações (cartão escuro com borda
 * dourada); o título do passo fica no cabeçalho, para sobrar altura ao conteúdo em
 * paisagem.
 */
export const HelpModalShell = ({
  visible,
  onClose,
  title,
  steps,
  widthRatio,
  maxHeightRatio = 0.85,
  fixedHeight = false,
}: HelpModalShellProps) => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [wasVisible, setWasVisible] = useState(visible);
  const fade = useRef(new Animated.Value(1)).current;

  // Reabrir começa do primeiro passo. Ajustado no render, e não num efeito, para não
  // mostrar por um quadro o passo em que o guia foi fechado.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setStep(0);
  }

  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;
  const currentStep = steps[step];
  const gold = theme.colors.truco.scoreText;

  const goTo = (next: number) => {
    fade.setValue(0);
    setStep(next);
    Animated.timing(fade, { toValue: 1, duration: STEP_FADE_MS, useNativeDriver: true }).start();
  };

  const handleNext = () => {
    if (isLastStep) onClose();
    else goTo(step + 1);
  };

  const handleBack = () => {
    if (!isFirstStep) goTo(step - 1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.background.overlay }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: gold,
              width: width * widthRatio,
            },
            fixedHeight
              ? { height: height * maxHeightRatio }
              : { maxHeight: height * maxHeightRatio },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: theme.colors.truco.divider }]}>
            <View style={styles.headerText}>
              <Text style={[styles.eyebrow, { color: theme.colors.text.secondary }]}>{title}</Text>
              <Text style={[styles.stepTitle, { color: gold }]} accessibilityRole="header">
                {currentStep.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={CLOSE_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={translate('a11y.close')}
            >
              <Ionicons name="close" size={ms(24)} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/*
           * `key`: cada passo começa do topo, sem herdar a rolagem do anterior. Sem `flex`
           * próprio: o padrão do ScrollView (cresce e encolhe) serve aos dois modos de altura.
           */}
          <ScrollView key={step} contentContainerStyle={styles.bodyContent}>
            <Animated.View style={{ opacity: fade }}>{currentStep.content}</Animated.View>
          </ScrollView>

          {/* Laterais de largura igual: os pontos ficam no centro mesmo quando o texto muda. */}
          <View style={[styles.footer, { borderTopColor: theme.colors.truco.divider }]}>
            <View style={styles.footerSide}>
              {/* Invisível no primeiro passo, mas ocupando o lugar. */}
              <TouchableOpacity
                style={[styles.navBtn, isFirstStep && styles.hidden]}
                onPress={handleBack}
                disabled={isFirstStep}
                hitSlop={NAV_HIT_SLOP}
                accessibilityRole="button"
                accessibilityState={{ disabled: isFirstStep }}
                accessibilityElementsHidden={isFirstStep}
                importantForAccessibility={isFirstStep ? 'no-hide-descendants' : 'auto'}
              >
                <Ionicons name="chevron-back" size={ms(14)} color={theme.colors.text.primary} />
                <Text style={[styles.navText, { color: theme.colors.text.primary }]}>
                  {translate('common.previous')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Para o leitor de tela, os pontos viram "Passo 2 de 5". */}
            <View
              style={styles.dots}
              accessible
              accessibilityLabel={translate('a11y.step_of', {
                current: step + 1,
                total: steps.length,
              })}
            >
              {steps.map((stepItem, i) => (
                <View
                  key={`step-${stepItem.title}`}
                  style={[
                    styles.dot,
                    i === step
                      ? { ...styles.activeDot, backgroundColor: gold }
                      : { ...styles.inactiveDot, backgroundColor: theme.colors.text.secondary },
                  ]}
                />
              ))}
            </View>

            <View style={[styles.footerSide, styles.footerSideEnd]}>
              <TouchableOpacity
                style={[styles.navBtn, styles.nextBtn, { backgroundColor: gold }]}
                onPress={handleNext}
                hitSlop={NAV_HIT_SLOP}
                accessibilityRole="button"
              >
                <Text style={[styles.navText, { color: theme.colors.text.black }]}>
                  {isLastStep ? translate('common.got_it') : translate('common.next')}
                </Text>
                <Ionicons
                  name={isLastStep ? 'checkmark' : 'chevron-forward'}
                  size={ms(14)}
                  color={theme.colors.text.black}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { borderRadius: ms(20), borderWidth: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(20),
    paddingTop: ms(14),
    paddingBottom: ms(12),
    borderBottomWidth: 1,
  },
  headerText: { flex: 1, gap: ms(6) },
  eyebrow: { fontFamily: 'Minecraft', fontSize: ms(8), opacity: 0.6 },
  stepTitle: { fontFamily: 'Minecraft', fontSize: ms(14) },
  bodyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: ms(20),
    paddingVertical: ms(14),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderTopWidth: 1,
  },
  footerSide: { flex: 1, alignItems: 'flex-start' },
  footerSideEnd: { alignItems: 'flex-end' },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    borderRadius: ms(10),
  },
  nextBtn: { paddingHorizontal: ms(16) },
  hidden: { opacity: 0 },
  navText: { fontFamily: 'Minecraft', fontSize: ms(9) },
  dots: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  dot: { height: ms(6), borderRadius: ms(3) },
  activeDot: { width: ms(18) },
  inactiveDot: { width: ms(6), opacity: 0.3 },
});
