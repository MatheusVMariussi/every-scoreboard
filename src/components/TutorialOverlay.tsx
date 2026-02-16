import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Canvas, DiffRect, rrect, rect } from '@shopify/react-native-skia';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TutorialOverlayProps {
  visible: boolean;
  spotlight: SpotlightRect | null;
  message: string;
  onNext?: () => void;
  onSkip?: () => void;
  nextText?: string;
}

// --- CONSTANTES ---
const SCREEN_PADDING = ms(20);
const ARROW_SIZE = ms(12);
const BORDER_RADIUS = ms(16);

// --- FUNÇÕES AUXILIARES DE LAYOUT ---
const getBaseStyles = (theme: any) => ({
  tooltip: {
    position: 'absolute',
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.brand.primary,
  } as any,
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.colors.brand.primary,
  } as any
});

const calculateSidePlacement = (
  spotlight: SpotlightRect,
  screenWidth: number,
  screenHeight: number,
  baseStyles: ReturnType<typeof getBaseStyles>
) => {
  const isLeftSide = spotlight.x < screenWidth / 2;
  const tooltipWidth = Math.min(ms(300), screenWidth * 0.45);

  const tooltipStyle = {
    ...baseStyles.tooltip,
    width: tooltipWidth,
    top: (screenHeight / 2) - ms(60),
    left: isLeftSide
      ? spotlight.x + spotlight.width + ms(25)
      : spotlight.x - tooltipWidth - ms(25)
  };

  const arrowStyle = {
    ...baseStyles.arrow,
    top: ms(50),
    transform: [{ rotate: isLeftSide ? '-90deg' : '90deg' }],
    [isLeftSide ? 'left' : 'right']: -ARROW_SIZE - 2
  };

  return { tooltipStyle, arrowStyle };
};

const calculateStandardPlacement = (
  spotlight: SpotlightRect,
  screenWidth: number,
  screenHeight: number,
  baseStyles: ReturnType<typeof getBaseStyles>
) => {
  const tooltipWidth = Math.min(screenWidth * 0.6, ms(500));
  const targetCenterX = spotlight.x + (spotlight.width / 2);
  const isTopHalf = (spotlight.y + spotlight.height) < screenHeight / 2;

  const verticalStyle = isTopHalf
    ? { top: spotlight.y + spotlight.height + ms(25) }
    : { bottom: (screenHeight - spotlight.y) + ms(25) };

  let left = targetCenterX - (tooltipWidth / 2);
  if (left < SCREEN_PADDING) left = SCREEN_PADDING;
  else if (left + tooltipWidth > screenWidth - SCREEN_PADDING) {
    left = screenWidth - tooltipWidth - SCREEN_PADDING;
  }

  let arrowX = targetCenterX - left - ARROW_SIZE;
  const minArrowX = BORDER_RADIUS;
  const maxArrowX = tooltipWidth - (ARROW_SIZE * 2) - BORDER_RADIUS;

  if (arrowX < minArrowX) arrowX = minArrowX;
  if (arrowX > maxArrowX) arrowX = maxArrowX;

  const tooltipStyle = {
    ...baseStyles.tooltip,
    width: tooltipWidth,
    left,
    ...verticalStyle
  };

  const arrowStyle = {
    ...baseStyles.arrow,
    left: arrowX,
    [isTopHalf ? 'top' : 'bottom']: -ARROW_SIZE,
    transform: [{ rotate: isTopHalf ? '0deg' : '180deg' }]
  };

  return { tooltipStyle, arrowStyle };
};

const getLayoutStyles = (
  spotlight: SpotlightRect | null,
  width: number,
  height: number,
  theme: any
) => {
  const baseStyles = getBaseStyles(theme);

  if (!spotlight) {
    const centerWidth = Math.min(width * 0.6, ms(500));
    return {
      tooltipStyle: {
        ...baseStyles.tooltip,
        width: centerWidth,
        top: (height / 2) - ms(60),
        left: (width - centerWidth) / 2,
      },
      arrowStyle: null
    };
  }

  const isLandscape = width > height;
  const isTallElement = isLandscape && (spotlight.height > height * 0.45);

  if (isTallElement) {
    return calculateSidePlacement(spotlight, width, height, baseStyles);
  }

  return calculateStandardPlacement(spotlight, width, height, baseStyles);
};

// --- COMPONENTE PRINCIPAL ---
export const TutorialOverlay = ({ visible, spotlight, message, onNext, onSkip, nextText }: TutorialOverlayProps) => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [isRendered, setIsRendered] = useState(false);

  const opacity = useSharedValue(0);
  const spotlightX = useSharedValue(0);
  const spotlightY = useSharedValue(0);
  const spotlightW = useSharedValue(0);
  const spotlightH = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) scheduleOnRN(setIsRendered, false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (spotlight) {
      const padding = ms(12);
      const config = { duration: 400, easing: Easing.inOut(Easing.quad) };

      spotlightX.value = withTiming(spotlight.x - padding, config);
      spotlightY.value = withTiming(spotlight.y - padding, config);
      spotlightW.value = withTiming(spotlight.width + (padding * 2), config);
      spotlightH.value = withTiming(spotlight.height + (padding * 2), config);
    }
  }, [spotlight]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const spotlightRadius = ms(12);
  const innerRect = useDerivedValue(() =>
    rrect(rect(spotlightX.value, spotlightY.value, spotlightW.value, spotlightH.value), spotlightRadius, spotlightRadius)
  );

  const outerRect = useDerivedValue(() => { return rrect(rect(0, 0, width, height), 0, 0); });

  const { tooltipStyle, arrowStyle } = useMemo(
    () => getLayoutStyles(spotlight, width, height, theme),
    [spotlight, width, height, theme]
  );

  if (!isRendered) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <DiffRect inner={innerRect} outer={outerRect} color="rgba(0,0,0,0.85)" />
      </Canvas>

      <View style={[styles.tooltipContainer, tooltipStyle]}>
        {spotlight && <View style={arrowStyle} />}

        <View style={styles.contentRow}>
            <Ionicons name="information-circle" size={ms(26)} color={theme.colors.brand.primary} style={{ marginTop: -2 }} />
            <Text style={[styles.message, { color: theme.colors.text.primary }]}>{message}</Text>
        </View>

        <View style={styles.buttonsRow}>
          {onSkip && (
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
               <Text style={[styles.skipText, { color: theme.colors.text.secondary }]}>{translate('common.skip')}</Text>
            </TouchableOpacity>
          )}

          {onNext && (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: theme.colors.brand.primary }]}
              onPress={onNext}
            >
              <Text style={[styles.nextText, { color: theme.colors.text.white }]}>{nextText || translate('common.next')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 10 },
  tooltipContainer: {
    padding: ms(20),
    borderRadius: BORDER_RADIUS,
    borderWidth: 2,
    alignItems: 'center',
    gap: ms(15),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(12)
  },
  message: { fontFamily: 'Minecraft', fontSize: ms(14), textAlign: 'left', lineHeight: ms(22), flex: 1 },
  buttonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: ms(15) },
  skipBtn: { padding: ms(10) },
  skipText: { fontFamily: 'Minecraft', fontSize: ms(11), textDecorationLine: 'underline' },
  nextBtn: { paddingHorizontal: ms(20), paddingVertical: ms(10), borderRadius: ms(8) },
  nextText: { fontFamily: 'Minecraft', fontSize: ms(12), fontWeight: 'bold' },
});
