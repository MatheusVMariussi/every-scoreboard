/**
 * Fila pendente, em duas peças que vivem em níveis diferentes da árvore.
 *
 * `PendingPill` fica dentro do rodapé, ao lado do botão principal.
 * `PendingPanel` é renderizado na **raiz** da tela, como os outros overlays da base.
 *
 * A separação não é estética: no Android um filho desenhado fora dos limites do pai não
 * recebe toque. Um painel de 190dp aberto a partir de um rodapé de 60dp apareceria e
 * seria intocável. Por isso o painel não é filho da pastilha.
 *
 * Fechado por padrão porque as duas telas são em paisagem e verticalmente apertadas —
 * um painel fixo comeria o placar.
 */

import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';
import type { ThemeColors } from '../../theme/types';
import { pendingCount, type PendingState } from '../../voice/pendingQueue';
import type { RosterPlayer } from '../../voice/types';
import { PendingEntryRow, UnresolvedRow } from './PendingEntryRow';

interface PillProps {
  pending: PendingState;
  colors: ThemeColors;
  onPress: () => void;
}

export const PendingPill = ({ pending, colors, onPress }: PillProps) => {
  const count = pendingCount(pending);
  if (count === 0) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: colors.voice.surface, borderColor: colors.voice.active },
      ]}
      accessibilityRole="button"
      accessibilityLabel={translate('voice.pending_count', { count })}
    >
      <Ionicons name="list" size={ms(14)} color={colors.voice.active} />
      <Text style={[styles.pillText, { color: colors.voice.active }]}>
        {translate('voice.pending_count', { count })}
      </Text>
    </TouchableOpacity>
  );
};

interface PanelProps {
  pending: PendingState;
  players: RosterPlayer[];
  colors: ThemeColors;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  onRemoveEntry: (playerId: string) => void;
  onAssignUnresolved: (unresolvedId: string, playerId: string) => void;
  onDismissUnresolved: (unresolvedId: string) => void;
}

export const PendingPanel = ({
  pending,
  players,
  colors,
  onClose,
  onApply,
  onClear,
  onRemoveEntry,
  onAssignUnresolved,
  onDismissUnresolved,
}: PanelProps) => {
  const count = pendingCount(pending);
  const entries = Object.values(pending.entries);
  const nameOf = (playerId: string) =>
    players.find((player) => player.id === playerId)?.name ?? playerId;

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.voice.panel, borderColor: colors.voice.active },
      ]}
    >
      <View style={[styles.panelHeader, { borderBottomColor: colors.voice.border }]}>
        <Text style={[styles.panelTitle, { color: colors.voice.active }]}>
          {translate('voice.pending_count', { count })}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={translate('common.got_it')}
        >
          <Ionicons name="chevron-down" size={ms(16)} color={colors.voice.idle} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {entries.map((entry) => (
          <PendingEntryRow
            key={entry.playerId}
            entry={entry}
            playerName={nameOf(entry.playerId)}
            colors={colors}
            onRemove={() => {
              onRemoveEntry(entry.playerId);
            }}
          />
        ))}

        {pending.unresolved.map((item) => (
          <UnresolvedRow
            key={item.id}
            entry={item}
            players={players}
            colors={colors}
            onAssign={(playerId) => {
              onAssignUnresolved(item.id, playerId);
            }}
            onDismiss={() => {
              onDismissUnresolved(item.id);
            }}
          />
        ))}
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: colors.voice.border }]}>
        <TouchableOpacity
          onPress={onClear}
          style={[styles.action, { borderColor: colors.voice.border }]}
          accessibilityRole="button"
          accessibilityLabel={translate('voice.clear')}
        >
          <Text style={[styles.actionText, { color: colors.voice.idleText }]}>
            {translate('voice.clear')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onApply}
          disabled={count === 0}
          style={[
            styles.action,
            { borderColor: colors.voice.active, backgroundColor: colors.voice.activeSoft },
            count === 0 && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={translate('voice.apply')}
          accessibilityState={{ disabled: count === 0 }}
        >
          <Text style={[styles.actionText, { color: colors.voice.active }]}>
            {translate('voice.apply')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    borderWidth: ms(2),
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: ms(8),
  },
  pillText: { fontFamily: 'Minecraft', fontSize: ms(9) },
  panel: {
    position: 'absolute',
    right: ms(20),
    // Acima do rodapé (60dp), para não cobrir o botão principal da tela.
    bottom: ms(66),
    width: ms(280),
    maxHeight: ms(190),
    borderWidth: ms(2),
    borderRadius: ms(10),
    // Abaixo do overlay de editar histórico (999) e do tutorial (9999).
    zIndex: 998,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(10),
    paddingVertical: ms(6),
    borderBottomWidth: 1,
  },
  panelTitle: { fontFamily: 'Minecraft', fontSize: ms(10) },
  iconBtn: { padding: ms(2) },
  list: { paddingHorizontal: ms(10) },
  actions: { flexDirection: 'row', gap: ms(8), padding: ms(8), borderTopWidth: 1 },
  action: {
    flex: 1,
    borderWidth: 1,
    borderRadius: ms(6),
    paddingVertical: ms(7),
    alignItems: 'center',
  },
  actionText: { fontFamily: 'Minecraft', fontSize: ms(9) },
  disabled: { opacity: 0.4 },
});
