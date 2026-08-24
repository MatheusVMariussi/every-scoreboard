/**
 * Uma linha da fila pendente.
 *
 * Três estados visuais, e a diferença entre eles é o ponto da funcionalidade:
 * - resolvida: nome reconhecido com folga
 * - baixa confiança: reconhecido, mas pede conferida — nunca se disfarça de certeza
 * - não reconhecida: verbo entendido, nome não; vira escolha por toque
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';
import type { ThemeColors } from '../../theme/types';
import { ACCEPT_SCORE } from '../../voice/matchPlayer';
import {
  UNRESOLVED_TTL_MS,
  type PendingEntry,
  type PendingValue,
  type UnresolvedEntry,
} from '../../voice/pendingQueue';
import type { RosterPlayer } from '../../voice/types';

/** Rótulo curto do valor pendente, no mesmo vocabulário que a tela já usa. */
const valueLabel = (value: PendingValue): string =>
  value.game === 'cacheta' ? translate(`cacheta.actions.${value.action}`) : String(value.value);

const valueColor = (value: PendingValue, colors: ThemeColors): string => {
  if (value.game === 'fodinha') return colors.voice.active;
  if (value.action === 'won') return colors.cacheta.win;
  if (value.action === 'fold') return colors.cacheta.fold;
  return colors.cacheta.loss;
};

interface EntryRowProps {
  entry: PendingEntry;
  playerName: string;
  colors: ThemeColors;
  onRemove: () => void;
}

export const PendingEntryRow = ({ entry, playerName, colors, onRemove }: EntryRowProps) => {
  const needsReview = entry.confidence < ACCEPT_SCORE;
  const accent = valueColor(entry.value, colors);

  return (
    <View style={styles.row}>
      <Text style={[styles.name, { color: colors.voice.idleText }]} numberOfLines={1}>
        {playerName}
      </Text>

      <View style={[styles.badge, { borderColor: accent }]}>
        <Text style={[styles.badgeText, { color: accent }]}>{valueLabel(entry.value)}</Text>
      </View>

      {entry.wasCorrected && (
        <View style={styles.flag}>
          <Ionicons name="refresh" size={ms(10)} color={colors.voice.idle} />
          <Text style={[styles.flagText, { color: colors.voice.idle }]}>
            {translate('voice.corrected')}
          </Text>
        </View>
      )}

      {needsReview && (
        <View style={styles.flag}>
          <Ionicons name="help-circle-outline" size={ms(11)} color={colors.status.warning} />
          <Text style={[styles.flagText, { color: colors.status.warning }]}>
            {translate('voice.confirm')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onRemove}
        style={styles.remove}
        accessibilityRole="button"
        accessibilityLabel={`${translate('voice.clear')} ${playerName}`}
      >
        <Ionicons name="close" size={ms(14)} color={colors.voice.idle} />
      </TouchableOpacity>
    </View>
  );
};

interface UnresolvedRowProps {
  entry: UnresolvedEntry;
  players: RosterPlayer[];
  colors: ThemeColors;
  onAssign: (playerId: string) => void;
  onDismiss: () => void;
}

/**
 * Nome não reconhecido. O toque resolve a linha **e** ensina o apelido para o resto da
 * sessão, então o mesmo palpite errado não se repete.
 *
 * A linha tem prazo: pede atenção com a borda pulsando e uma barra que esvazia, e some
 * sozinha se ninguém responder. Quem apaga de fato é o varredor em `useVoiceScoring`;
 * aqui a animação só mostra quanto tempo resta.
 */
export const UnresolvedRow = ({
  entry,
  players,
  colors,
  onAssign,
  onDismiss,
}: UnresolvedRowProps) => {
  const reducedMotion = useReducedMotion();
  const remaining = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    const left = Math.max(0, entry.expiresAt - Date.now());
    remaining.value = left / UNRESOLVED_TTL_MS;
    remaining.value = withTiming(0, { duration: left, easing: Easing.linear });

    // A barra é informação (quanto tempo resta), então fica mesmo com movimento
    // reduzido. O pulso é só chamariz — esse sai.
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [entry.expiresAt, pulse, reducedMotion, remaining]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      pulse.value,
      [0, 1],
      [colors.status.warning, colors.voice.active],
    ),
  }));

  // `scaleX` com origem à esquerda: anima no compositor, sem mexer em layout.
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: remaining.value }] }));

  // Quando o casamento foi ambíguo já sabemos entre quem: oferece só esses.
  const candidates =
    entry.candidates.length > 0
      ? players.filter((player) => entry.candidates.includes(player.id))
      : players;

  return (
    <Animated.View style={[styles.unresolved, borderStyle]}>
      <Text style={[styles.question, { color: colors.voice.idleText }]}>
        {translate('voice.who_was_it', { token: entry.token })}
      </Text>

      <View style={[styles.countdownTrack, { backgroundColor: colors.voice.border }]}>
        <Animated.View
          style={[styles.countdownFill, { backgroundColor: colors.status.warning }, barStyle]}
        />
      </View>

      <View style={styles.candidates}>
        {candidates.map((player) => (
          <TouchableOpacity
            key={player.id}
            onPress={() => {
              onAssign(player.id);
            }}
            style={[styles.candidate, { borderColor: colors.voice.active }]}
            accessibilityRole="button"
            accessibilityLabel={player.name}
          >
            <Text style={[styles.candidateText, { color: colors.voice.active }]} numberOfLines={1}>
              {player.name}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={onDismiss}
          style={styles.remove}
          accessibilityRole="button"
          accessibilityLabel={translate('voice.clear')}
        >
          <Ionicons name="close" size={ms(14)} color={colors.voice.idle} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    paddingVertical: ms(6),
  },
  name: { fontFamily: 'Minecraft', fontSize: ms(11), width: ms(80) },
  badge: {
    minWidth: ms(26),
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderWidth: 1,
    borderRadius: ms(6),
    alignItems: 'center',
  },
  badgeText: { fontFamily: 'Minecraft', fontSize: ms(10) },
  flag: { flexDirection: 'row', alignItems: 'center', gap: ms(3) },
  flagText: { fontFamily: 'Minecraft', fontSize: ms(8) },
  remove: { padding: ms(4), marginLeft: 'auto' },
  unresolved: {
    borderWidth: 1,
    borderRadius: ms(8),
    padding: ms(8),
    marginVertical: ms(4),
    gap: ms(6),
  },
  question: { fontFamily: 'Minecraft', fontSize: ms(10) },
  countdownTrack: { height: ms(2), borderRadius: ms(1), overflow: 'hidden' },
  countdownFill: { flex: 1, transformOrigin: 'left' },
  candidates: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: ms(6) },
  candidate: {
    borderWidth: 1,
    borderRadius: ms(6),
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    maxWidth: ms(90),
  },
  candidateText: { fontFamily: 'Minecraft', fontSize: ms(9) },
});
