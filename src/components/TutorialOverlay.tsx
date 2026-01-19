import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Canvas, Rect, DiffRect, rrect, rect } from '@shopify/react-native-skia';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
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
  nextText?: string; // e.g. "NEXT" or "FINISH"
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TutorialOverlay = ({ visible, spotlight, message, onNext, nextText }: TutorialOverlayProps) => {
  const { theme } = useTheme();

  // Animation values
  const opacity = useSharedValue(0);
  const spotlightX = useSharedValue(0);
  const spotlightY = useSharedValue(0);
  const spotlightW = useSharedValue(0);
  const spotlightH = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  useEffect(() => {
    if (spotlight) {
      // Animate the spotlight transition
      const transitionConfig = { duration: 400, easing: Easing.inOut(Easing.quad) };
      spotlightX.value = withTiming(spotlight.x, transitionConfig);
      spotlightY.value = withTiming(spotlight.y, transitionConfig);
      spotlightW.value = withTiming(spotlight.width, transitionConfig);
      spotlightH.value = withTiming(spotlight.height, transitionConfig);
    }
  }, [spotlight]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  // Determine tooltip position (top or bottom of spotlight)
  const isTopHalf = spotlight && spotlight.y + spotlight.height / 2 < SCREEN_HEIGHT / 2;
  const tooltipTop = isTopHalf
    ? (spotlight ? spotlight.y + spotlight.height + 20 : SCREEN_HEIGHT / 2)
    : undefined;
  const tooltipBottom = !isTopHalf
    ? (spotlight ? SCREEN_HEIGHT - spotlight.y + 20 : SCREEN_HEIGHT / 2)
    : undefined;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      {/* Dark Overlay with Hole */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <DiffRect
          inner={rrect(rect(spotlightX.value, spotlightY.value, spotlightW.value, spotlightH.value), 10, 10)}
          outer={rrect(rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT), 0, 0)}
          color="rgba(0,0,0,0.85)"
        />
      </Canvas>

      {/* Tooltip & Controls */}
      <View
        style={[
          styles.tooltipContainer,
          {
            top: tooltipTop,
            bottom: tooltipBottom,
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.brand.primary
          }
        ]}
      >
        <Text style={[styles.message, { color: theme.colors.text.primary }]}>{message}</Text>

        {onNext && (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: theme.colors.brand.primary }]}
            onPress={onNext}
          >
            <Text style={styles.nextText}>{nextText || translate('common.next')}</Text>
          </TouchableOpacity>
        )}
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
    borderWidth: 1,
    alignItems: 'center',
    gap: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  message: {
    fontFamily: 'Minecraft',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  nextBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextText: {
    fontFamily: 'Minecraft',
    color: '#FFF',
    fontSize: 12,
  },
});
