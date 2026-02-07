import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ScreenOrientation from 'expo-screen-orientation';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';

type TransitionRouteProp = RouteProp<RootStackParamList, 'Transition'>;
type TransitionNavProp = NativeStackNavigationProp<RootStackParamList, 'Transition'>;

const LANDSCAPE_TARGETS = new Set(['Cacheta', 'Canastra', 'Fodinha']);

export const TransitionScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<TransitionNavProp>();
  const route = useRoute<TransitionRouteProp>();
  const { target } = route.params;
  const hasNavigated = useRef(false);

  // Spinning rotation icon
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1
    );
  }, [rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const navigateToTarget = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    const routes = target === 'Home'
      ? [{ name: 'Home' as const }]
      : [{ name: 'Home' as const }, { name: target }];

    navigation.dispatch(
      CommonActions.reset({ index: routes.length - 1, routes })
    );
  };

  useEffect(() => {
    let cancelled = false;
    let subscription: ScreenOrientation.Subscription | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const safeNavigate = () => {
      if (!cancelled) navigateToTarget();
    };

    const doTransition = async () => {
      const needsLandscape = LANDSCAPE_TARGETS.has(target);
      const targetLock = needsLandscape
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.PORTRAIT_UP;

      // Check current orientation
      const current = await ScreenOrientation.getOrientationAsync();
      const isLandscape =
        current === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        current === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

      // Sync the expo lock to match the native orientation prop
      await ScreenOrientation.lockAsync(targetLock);

      if (needsLandscape === isLandscape) {
        // Already in correct orientation — go now
        safeNavigate();
        return;
      }

      // The native `orientation` prop on this screen triggers the rotation.
      // Listen for when it completes, then wait for the visual animation to settle.
      subscription = ScreenOrientation.addOrientationChangeListener(() => {
        setTimeout(safeNavigate, 300);
      });

      // Safety fallback
      fallbackTimer = setTimeout(safeNavigate, 1200);
    };

    doTransition();

    return () => {
      cancelled = true;
      if (subscription) ScreenOrientation.removeOrientationChangeListener(subscription);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [navigation, target]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.darkVoid }]}>
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons
          name="screen-rotation"
          size={48}
          color={theme.colors.neon.primary}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
