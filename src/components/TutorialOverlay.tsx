import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Canvas, DiffRect, rrect, rect } from '@shopify/react-native-skia';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, useDerivedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

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

export const TutorialOverlay = ({ visible, spotlight, message, onNext, onSkip, nextText }: TutorialOverlayProps) => {
  const { theme } = useTheme();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [isRendered, setIsRendered] = useState(false);

  // Animation values
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
        if (finished) {
          runOnJS(setIsRendered)(false);
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    if (spotlight) {
      // Add padding
      const padding = 12;
      const x = spotlight.x - padding;
      const y = spotlight.y - padding;
      const w = spotlight.width + (padding * 2);
      const h = spotlight.height + (padding * 2);

      // Animate the spotlight transition
      const transitionConfig = { duration: 400, easing: Easing.inOut(Easing.quad) };
      spotlightX.value = withTiming(x, transitionConfig);
      spotlightY.value = withTiming(y, transitionConfig);
      spotlightW.value = withTiming(w, transitionConfig);
      spotlightH.value = withTiming(h, transitionConfig);
    }
  }, [spotlight]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const innerRect = useDerivedValue(() => {
    return rrect(rect(spotlightX.value, spotlightY.value, spotlightW.value, spotlightH.value), 16, 16);
  });

  const outerRect = useDerivedValue(() => {
    return rrect(rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT), 0, 0);
  });

  if (!isRendered) return null;

  // Determine tooltip position (top or bottom of spotlight)
  // If no spotlight (e.g. loading or center message), center the tooltip
  const isTopHalf = spotlight ? (spotlight.y + spotlight.height / 2 < SCREEN_HEIGHT / 2) : true;

  const tooltipStyle: any = {
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.brand.primary,
  };

  if (spotlight) {
    if (isTopHalf) {
      tooltipStyle.top = spotlight.y + spotlight.height + 30;
    } else {
      tooltipStyle.bottom = SCREEN_HEIGHT - spotlight.y + 30;
    }
  } else {
    // Center if no spotlight
    tooltipStyle.top = SCREEN_HEIGHT / 2 - 50;
  }

  // Arrow style
  const arrowStyle: any = {
      position: 'absolute',
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: theme.colors.brand.primary,
      alignSelf: 'center',
  };

  if (spotlight) {
      if (isTopHalf) {
          arrowStyle.top = -10;
          arrowStyle.transform = [{ rotate: '0deg'}];
      } else {
          arrowStyle.bottom = -10;
          arrowStyle.transform = [{ rotate: '180deg'}];
      }
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      {/* Dark Overlay with Hole */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <DiffRect
          inner={innerRect}
          outer={outerRect}
          color="rgba(0,0,0,0.85)"
        />
      </Canvas>

      {/* Tooltip & Controls */}
      <View style={[styles.tooltipContainer, tooltipStyle]}>
        {spotlight && <View style={arrowStyle} />}

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Ionicons name="information-circle" size={24} color={theme.colors.brand.primary} style={{ marginTop: -2 }} />
            <Text style={[styles.message, { color: theme.colors.text.primary }]}>{message}</Text>
        </View>

        <View style={styles.buttonsRow}>
          {onSkip && (
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
               <Text style={[styles.skipText, { color: theme.colors.text.secondary }]}>SKIP</Text>
            </TouchableOpacity>
          )}

          {onNext && (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: theme.colors.brand.primary }]}
              onPress={onNext}
            >
              <Text style={styles.nextText}>{nextText || translate('common.next')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // High z-index to stay on top
    elevation: 10,
  },
  tooltipContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  message: {
    fontFamily: 'Minecraft',
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 15,
  },
  skipBtn: {
    padding: 10,
  },
  skipText: {
    fontFamily: 'Minecraft',
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  nextBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nextText: {
    fontFamily: 'Minecraft',
    color: '#FFF',
    fontSize: 12,
  },
});
