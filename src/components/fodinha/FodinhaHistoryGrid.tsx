import { memo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FodinhaPlayer, FodinhaRound } from '../../hooks/useFodinhaGame';
import { translate } from '../../i18n';
import { ms } from '../../theme/responsive';
import { useTheme } from '../../theme/useTheme';
import { TABLE } from './tableMetrics';

interface Props {
  players: readonly FodinhaPlayer[];
  rounds: readonly FodinhaRound[];
  onPressRound: (roundIndex: number) => void;
}

/**
 * Histórico das rodadas: a coluna do meio do placar, com rolagem própria.
 *
 * Nomes e painel da rodada ficam parados nas pontas. `flexGrow: 0` faz o histórico
 * ocupar só o tamanho do conteúdo enquanto há poucas rodadas, com o painel colado nele.
 * Com muitas, `flexShrink` encolhe o histórico até o painel caber inteiro, e aí só ele
 * rola.
 *
 * `memo` porque a tela re-renderiza a cada mudança de volume enquanto a voz escuta, e
 * esta é a parte que cresce a cada rodada.
 */
export const FodinhaHistoryGrid = memo(function FodinhaHistoryGrid({
  players,
  rounds,
  onPressRound,
}: Props) {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const contentWidth = useRef<number | null>(null);

  // Só a largura importa: a altura muda ao adicionar jogador e não deve mexer no scroll.
  const handleContentSizeChange = (width: number) => {
    const previous = contentWidth.current;
    contentWidth.current = width;
    if (previous !== null && width <= previous) return;

    // Abre na rodada mais recente; depois acompanha cada rodada nova.
    scrollRef.current?.scrollToEnd({ animated: previous !== null });
    // A barra piscando avisa que há rodadas mais antigas à esquerda.
    scrollRef.current?.flashScrollIndicators();
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      style={styles.scroll}
      onContentSizeChange={handleContentSizeChange}
    >
      {rounds.map((round) => (
        <TouchableOpacity
          key={round.id}
          style={styles.column}
          onPress={() => {
            onPressRound(round.index);
          }}
          accessibilityRole="button"
          accessibilityLabel={translate('common.edit_round', { index: round.index + 1 })}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>{round.index + 1}</Text>
          </View>
          {players.map((p) => (
            <View
              key={p.id}
              style={[styles.cell, { backgroundColor: theme.colors.fodinha.cardBackground }]}
            >
              <HistoryMark damage={p.history[round.index]} />
            </View>
          ))}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

/** Ponto verde = acertou; "-N" = vidas perdidas; traço apagado = não jogou a rodada. */
export const HistoryMark = ({ damage }: { damage: number | null | undefined }) => {
  const { theme } = useTheme();

  if (typeof damage !== 'number') {
    return <View style={[styles.skipMark, { backgroundColor: theme.colors.fodinha.muted }]} />;
  }
  if (damage === 0) {
    return <View style={[styles.safeDot, { backgroundColor: theme.colors.fodinha.safeDot }]} />;
  }
  return (
    <Text style={[styles.damageText, { color: theme.colors.fodinha.damageText }]}>-{damage}</Text>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 1 },
  column: {
    width: TABLE.historyColumnWidth,
    alignItems: 'center',
    paddingTop: TABLE.panelBorderWidth,
  },
  header: { height: TABLE.headerHeight, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: ms(10), fontFamily: 'Minecraft', color: '#888' },
  cell: {
    width: TABLE.historyCellWidth,
    height: TABLE.rowHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: TABLE.rowGap,
    borderRadius: ms(6),
  },
  safeDot: { width: ms(8), height: ms(8), borderRadius: ms(4) },
  skipMark: { width: ms(10), height: ms(2), borderRadius: ms(1) },
  damageText: { fontFamily: 'Minecraft', fontSize: ms(12) },
});
