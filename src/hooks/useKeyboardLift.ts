import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  type KeyboardEvent,
  type LayoutChangeEvent,
} from 'react-native';

interface Frame {
  top: number;
  bottom: number;
}

interface LiftOptions {
  /** Folga entre o fundo do card e o topo do teclado. */
  gap: number;
  /** Até onde o topo do card pode subir (área segura). */
  minTop: number;
}

/**
 * Quanto o card precisa subir para o fundo dele ficar `gap` acima do teclado: nada se já
 * cabe. Se o card não cabe inteiro acima do teclado, para no topo seguro — o topo, com o
 * título e o campo, é o que fica à vista.
 */
export const getKeyboardLift = (card: Frame, keyboardTop: number, options: LiftOptions): number => {
  const overlap = card.bottom + options.gap - keyboardTop;
  const room = card.top - options.minTop;
  return Math.max(0, Math.min(overlap, room));
};

/**
 * Curva da animação do teclado do iOS (`UIViewAnimationCurve` 7, que é privada), na
 * aproximação de Bézier mais usada. Com a duração que vem no evento, o card anda junto
 * com o teclado.
 */
const KEYBOARD_EASING = Easing.bezier(0.38, 0.7, 0.125, 1);

/**
 * Card centralizado que sobe só o necessário quando o teclado abre, e volta ao centro
 * quando fecha. A conta usa o quadro real do teclado que vem no evento e a posição do card
 * medida no layout, em vez de prender o card no topo.
 *
 * O card precisa estar num contêiner do tamanho da janela (o fundo do Modal), para o
 * `onLayout` dar a posição na tela.
 *
 * Só no iOS: lá o teclado nunca encolhe a janela, e o evento traz o quadro final e a
 * duração. No Android o card fica no centro — em paisagem o teclado abre o editor de tela
 * cheia, e dentro do Modal edge-to-edge os eventos de teclado não são confiáveis.
 */
export const useKeyboardLift = (active: boolean, options: LiftOptions) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const frame = useRef<Frame | null>(null);
  const { gap, minTop } = options;

  useEffect(() => {
    if (!active || Platform.OS !== 'ios') return;
    translateY.setValue(0);

    // Abrir, fechar (o quadro final fica abaixo da tela) e mudar de altura passam por aqui.
    const subscription = Keyboard.addListener(
      'keyboardWillChangeFrame',
      ({ endCoordinates, duration }: KeyboardEvent) => {
        const lift = frame.current
          ? getKeyboardLift(frame.current, endCoordinates.screenY, { gap, minTop })
          : 0;
        Animated.timing(translateY, {
          toValue: -lift,
          duration,
          easing: KEYBOARD_EASING,
          useNativeDriver: true,
        }).start();
      },
    );
    return () => {
      subscription.remove();
    };
  }, [active, gap, minTop, translateY]);

  /** O layout ignora o `transform`: a posição medida é sempre a do card no centro. */
  const onLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    frame.current = { top: y, bottom: y + height };
  };

  return { onLayout, transform: [{ translateY }] };
};
