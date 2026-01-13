import React from 'react';
import { Pressable, Text, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const GameButton = ({ title, onPress, style, disabled }: GameButtonProps) => {
  const { theme } = useTheme();

  // Cores padrão (se não vierem via prop style)
  const defaultBgColor = theme.colors.home.buttonBackground || '#FF9F00';
  const defaultBorderColor = theme.colors.home.buttonBorder || '#CC7A00';
  
  // Textos
  const textColor = theme.colors.home.title || '#FFFFFF';
  const textOutline = theme.colors.home.titleOutline || '#4A2311';

  // Animação de escala
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
            backgroundColor: defaultBgColor, 
            borderColor: defaultBorderColor 
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
    backgroundColor: 'transparent', // Garante que não tenha "caixa quadrada"
  },
  visualContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 20, // Arredondamento visual
    borderWidth: 0,
    borderBottomWidth: 6, // Efeito 3D
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombras
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
    marginTop: -4, 
    width: '100%',
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 24, // Aumentei um pouco para preencher melhor
    fontWeight: '900',
    letterSpacing: 1,
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});