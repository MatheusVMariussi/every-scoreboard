import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Canvas, DiffRect, rrect, rect } from '@shopify/react-native-skia';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
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
          scheduleOnRN(setIsRendered, false);
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    if (spotlight) {
      const padding = 12;
      const x = spotlight.x - padding;
      const y = spotlight.y - padding;
      const w = spotlight.width + (padding * 2);
      const h = spotlight.height + (padding * 2);

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
    return rrect(rect(spotlightX.value, spotlightY.value, spotlightW.value, spotlightH.value), 12, 12);
  });

  const outerRect = useDerivedValue(() => {
    return rrect(rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT), 0, 0);
  });

  if (!isRendered) return null;

  // --- CÁLCULOS DE POSICIONAMENTO DINÂMICO ---
  const SCREEN_PADDING = 20;
  const ARROW_SIZE = 12;
  
  let tooltipStyle: any = {
    position: 'absolute',
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.brand.primary,
  };

  // Seta padrão (apontando para CIMA por default)
  let arrowStyle: any = {
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
  };

  if (spotlight) {
    // 1. Detectar se é um elemento ALTO (tipo barra lateral)
    const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
    
    const isTallElement = isLandscape && (spotlight.height > SCREEN_HEIGHT * 0.45);

    if (isTallElement) {
        // --- POSICIONAMENTO LATERAL (SIDE) ---
        
        // Decide se coloca na Direita ou Esquerda baseado no centro da tela
        const isLeftSide = spotlight.x < SCREEN_WIDTH / 2;
        
        // Largura do tooltip na lateral deve ser menor para caber
        const SIDE_TOOLTIP_WIDTH = Math.min(300, SCREEN_WIDTH * 0.45);
        tooltipStyle.width = SIDE_TOOLTIP_WIDTH;

        // Centralizar verticalmente na tela (mais seguro para elementos altos)
        tooltipStyle.top = (SCREEN_HEIGHT / 2) - 60; // Offset visual aproximado
        
        if (isLeftSide) {
            // Colocar à DIREITA do elemento
            tooltipStyle.left = spotlight.x + spotlight.width + 25;
            
            // Seta aponta para a ESQUERDA
            arrowStyle.left = -ARROW_SIZE - 2; // Jogar pra fora do balão
            arrowStyle.top = 50; // Centralizar na altura do balão (aprox)
            arrowStyle.transform = [{ rotate: '-90deg'}]; // Rotacionar para apontar esq
        } else {
            // Colocar à ESQUERDA do elemento
            tooltipStyle.left = spotlight.x - SIDE_TOOLTIP_WIDTH - 25;
            
            // Seta aponta para a DIREITA
            arrowStyle.right = -ARROW_SIZE - 2;
            arrowStyle.top = 50;
            arrowStyle.transform = [{ rotate: '90deg'}];
        }

    } else {
        // --- POSICIONAMENTO PADRÃO (TOP/BOTTOM) ---
        
        const TOOLTIP_WIDTH = Math.min(SCREEN_WIDTH * 0.6, 500);
        tooltipStyle.width = TOOLTIP_WIDTH;

        const targetCenterX = spotlight.x + (spotlight.width / 2);
        const targetBottomY = spotlight.y + spotlight.height;
        const targetTopY = spotlight.y;

        const isTopHalf = targetBottomY < SCREEN_HEIGHT / 2;

        if (isTopHalf) {
           // Mostrar EMBAIXO
           tooltipStyle.top = targetBottomY + 25;
           arrowStyle.top = -ARROW_SIZE; 
           arrowStyle.transform = [{ rotate: '0deg'}];
        } else {
           // Mostrar EM CIMA
           tooltipStyle.bottom = (SCREEN_HEIGHT - targetTopY) + 25;
           arrowStyle.bottom = -ARROW_SIZE;
           arrowStyle.transform = [{ rotate: '180deg'}];
        }

        // Clamp Horizontal
        let idealLeft = targetCenterX - (TOOLTIP_WIDTH / 2);
        if (idealLeft < SCREEN_PADDING) idealLeft = SCREEN_PADDING;
        else if (idealLeft + TOOLTIP_WIDTH > SCREEN_WIDTH - SCREEN_PADDING) {
            idealLeft = SCREEN_WIDTH - TOOLTIP_WIDTH - SCREEN_PADDING;
        }
        tooltipStyle.left = idealLeft;

        // Ajuste da Seta Horizontal
        let arrowX = targetCenterX - idealLeft - ARROW_SIZE;
        // Limites da seta dentro do balão
        const BORDER_RADIUS = 16;
        if (arrowX < BORDER_RADIUS) arrowX = BORDER_RADIUS;
        if (arrowX > TOOLTIP_WIDTH - (ARROW_SIZE * 2) - BORDER_RADIUS) {
            arrowX = TOOLTIP_WIDTH - (ARROW_SIZE * 2) - BORDER_RADIUS;
        }
        arrowStyle.left = arrowX;
    }

  } else {
    // Sem spotlight (Centro da tela)
    const CENTER_WIDTH = Math.min(SCREEN_WIDTH * 0.6, 500);
    tooltipStyle.width = CENTER_WIDTH;
    tooltipStyle.top = (SCREEN_HEIGHT / 2) - 60;
    tooltipStyle.left = (SCREEN_WIDTH - CENTER_WIDTH) / 2;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <DiffRect inner={innerRect} outer={outerRect} color="rgba(0,0,0,0.85)" />
      </Canvas>

      <View style={[styles.tooltipContainer, tooltipStyle]}>
        {spotlight && <View style={arrowStyle} />}

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Ionicons name="information-circle" size={26} color={theme.colors.brand.primary} style={{ marginTop: -2 }} />
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
  message: { fontFamily: 'Minecraft', fontSize: 14, textAlign: 'left', lineHeight: 22, flex: 1 },
  buttonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: 15 },
  skipBtn: { padding: 10 },
  skipText: { fontFamily: 'Minecraft', fontSize: 11, textDecorationLine: 'underline' },
  nextBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  nextText: { fontFamily: 'Minecraft', fontSize: 12, fontWeight: 'bold' },
});