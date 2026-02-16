import React from 'react';
import { Pressable, Text, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { ms } from '../theme/responsive';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const GameButton = ({
  title,
  onPress,
  style,
  disabled,
  variant = 'primary'
}: GameButtonProps) => {
  const { theme } = useTheme();

  let bgColor, borderColor;

  switch (variant) {
    case 'secondary':
      bgColor = theme.colors.home.buttonSecondary;
      borderColor = theme.colors.home.buttonSecondaryBorder;
      break;
    case 'destructive':
      bgColor = theme.colors.home.buttonDestructive;
      borderColor = theme.colors.home.buttonDestructiveBorder;
      break;
    case 'primary':
    default:
      bgColor = theme.colors.home.buttonBackground;
      borderColor = theme.colors.home.buttonBorder;
      break;
  }

  const textColor = theme.colors.home.title || '#FFFFFF';
  const textOutline = theme.colors.home.titleOutline || '#4A2311';

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.touchableContainer,
        disabled && styles.disabled,
      ]}
    >
      <AnimatedView
        style={[
          styles.visualContainer,
          animatedStyle,
          {
            backgroundColor: bgColor,
            borderColor: borderColor
          },
          style
        ]}
      >
        <View style={styles.content}>
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                textShadowColor: textOutline,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title.toUpperCase()}
          </Text>
        </View>
      </AnimatedView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  visualContainer: {
    width: '100%',
    height: '100%',
    borderRadius: ms(20),
    borderWidth: 0,
    borderBottomWidth: ms(6),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ms(-4),
    width: '100%',
    paddingHorizontal: ms(8),
  },
  text: {
    fontSize: ms(24),
    fontWeight: '900',
    letterSpacing: ms(1),
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});
