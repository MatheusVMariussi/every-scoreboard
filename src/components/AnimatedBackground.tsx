import React, { useEffect, useMemo } from 'react';
import { useWindowDimensions, StyleSheet, View } from 'react-native';
import { Canvas, Rect, Circle, BlurMask, LinearGradient, vec } from "@shopify/react-native-skia";
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';

export const AnimatedBackground = () => {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();

  const bgDark = theme.colors.background.darkVoid;
  const neon1 = theme.colors.neon.primary;
  const neon2 = theme.colors.neon.secondary;

  const move1 = useSharedValue(0);
  const move2 = useSharedValue(0);

  useEffect(() => {
    // Configuração suave e lenta para não distrair o usuário
    const config = { duration: 12000, easing: Easing.inOut(Easing.ease) }; 

    move1.value = withRepeat(withTiming(1, config), -1, true);
    // O segundo orbe tem tempo diferente para criar aleatoriedade no movimento
    move2.value = withRepeat(withTiming(1, { ...config, duration: 15000 }), -1, true);
  }, []);

  // Cálculos de posição reativos (Derived Values)
  // movemos os orbes em eixos opostos para cobrir a tela
  const circle1Pos = useDerivedValue(() => {
    return vec(width * move1.value, height * 0.3);
  });

  const circle2Pos = useDerivedValue(() => {
    return vec(width * (1 - move2.value), height * 0.7);
  });

  // Proteção contra renderização inicial sem dimensões (evita erros no Android)
  if (width === 0 || height === 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={{ flex: 1 }}>
        {/* Fundo Sólido */}
        <Rect x={0} y={0} width={width} height={height} color={bgDark} />

        {/* Orbe Neon Primário (Ciano) */}
        <Circle c={circle1Pos} r={width * 0.45}>
          {/* BlurMask alto cria o efeito de "luz" difusa em vez de uma bola sólida */}
          <BlurMask blur={80} style="normal" />
           <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[neon1, bgDark]} 
          />
        </Circle>

        {/* Orbe Neon Secundário (Roxo) */}
        <Circle c={circle2Pos} r={width * 0.55} opacity={0.6}>
          <BlurMask blur={100} style="normal" />
           <LinearGradient
            start={vec(width, 0)}
            end={vec(0, height)}
            colors={[neon2, bgDark]}
          />
        </Circle>
      </Canvas>
    </View>
  );
};