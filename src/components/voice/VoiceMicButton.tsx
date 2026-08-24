/**
 * Controles de microfone, ancorados no rodapé.
 *
 * Fica no rodapé e não no cabeçalho por dois motivos: em paisagem o polegar alcança a
 * base da tela, o que importa para um botão que se segura; e o lado direito do cabeçalho
 * da Fodinha já está ocupado pelo seletor de cartas.
 *
 * Dois controles: segurar para falar, e um interruptor para o modo sempre ouvindo.
 */

import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';
import type { ThemeColors } from '../../theme/types';
import type { VoiceMode } from '../../voice/useSpeechSession';

/** O módulo nativo reporta volume entre -2 e 10. */
const VOLUME_MIN = -2;
const VOLUME_MAX = 10;

const normalizeVolume = (volume: number): number => {
  const ratio = (volume - VOLUME_MIN) / (VOLUME_MAX - VOLUME_MIN);
  return Math.max(0, Math.min(1, ratio));
};

interface Props {
  mode: VoiceMode;
  isListening: boolean;
  volume: number;
  onPressIn: () => void;
  onPressOut: () => void;
  onToggleAlwaysOn: () => void;
}

export const VoiceMicControls = ({
  mode,
  isListening,
  volume,
  colors,
  onPressIn,
  onPressOut,
  onToggleAlwaysOn,
}: Props & { colors: ThemeColors }) => {
  const alwaysOn = mode === 'continuous';
  const pulse = useSharedValue(0);

  useEffect(() => {
    // O anel segue o volume, então o usuário vê que está sendo ouvido de verdade —
    // um indicador que só liga/desliga não distingue "ouvindo" de "travado".
    pulse.value = withTiming(isListening ? normalizeVolume(volume) : 0, { duration: 120 });
  }, [isListening, volume, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.75,
    transform: [{ scale: 1 + pulse.value * 0.35 }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.micWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            { borderColor: alwaysOn ? colors.voice.recording : colors.voice.active },
            ringStyle,
          ]}
        />
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          // Segurar o botão não deve competir com o modo sempre ouvindo.
          disabled={alwaysOn}
          activeOpacity={0.8}
          style={[
            styles.mic,
            {
              backgroundColor: colors.voice.surface,
              borderColor: isListening ? colors.voice.active : colors.voice.border,
            },
            alwaysOn && styles.micDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={translate('voice.hold_to_talk')}
          accessibilityState={{ disabled: alwaysOn, busy: isListening }}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={ms(22)}
            color={isListening ? colors.voice.active : colors.voice.idle}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onToggleAlwaysOn}
        style={[
          styles.toggle,
          {
            borderColor: alwaysOn ? colors.voice.recording : colors.voice.border,
            backgroundColor: alwaysOn ? colors.voice.recordingSoft : colors.voice.surface,
          },
        ]}
        accessibilityRole="switch"
        accessibilityLabel={translate('voice.always_on')}
        accessibilityState={{ checked: alwaysOn }}
      >
        <Ionicons
          name={alwaysOn ? 'radio' : 'radio-outline'}
          size={ms(12)}
          color={alwaysOn ? colors.voice.recording : colors.voice.idle}
        />
        <Text
          style={[
            styles.toggleText,
            { color: alwaysOn ? colors.voice.recording : colors.voice.idleText },
          ]}
        >
          {alwaysOn ? translate('voice.listening') : translate('voice.always_on')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const MIC_SIZE = ms(46);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  micWrap: { width: MIC_SIZE, height: MIC_SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    borderWidth: ms(2),
  },
  mic: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    borderWidth: ms(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  micDisabled: { opacity: 0.45 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    borderWidth: 1,
    borderRadius: ms(6),
    paddingHorizontal: ms(8),
    paddingVertical: ms(5),
    maxWidth: ms(120),
  },
  toggleText: { fontFamily: 'Minecraft', fontSize: ms(8) },
});
