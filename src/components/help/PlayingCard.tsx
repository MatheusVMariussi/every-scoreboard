import { View, Text, StyleSheet } from 'react-native';
import { ms } from '../../theme/responsive';

export type Suit = '♠' | '♥' | '♦' | '♣';

/** Vermelho de naipe sobre a carta branca (não segue o tema: a carta é sempre branca). */
export const RED_SUIT_COLOR = '#D32F2F';

export const isRedSuit = (suit: Suit): boolean => suit === '♥' || suit === '♦';

interface PlayingCardProps {
  value: string;
  suit: Suit;
  /** Borda dourada da manilha (Truco). */
  isManilha?: boolean;
  /** Borda escura para destacar a carta mais forte de uma sequência. */
  highlight?: boolean;
  /** Apagada: carta que saiu do jogo no exemplo (anulada, por exemplo). */
  dimmed?: boolean;
  /** `tiny`: dez cartas numa fileira só, até num iPhone SE deitado. */
  size?: 'regular' | 'small' | 'tiny';
}

/** Carta de baralho desenhada nos guias de "como jogar". */
export const PlayingCard = ({
  value,
  suit,
  isManilha = false,
  highlight = false,
  dimmed = false,
  size = 'regular',
}: PlayingCardProps) => {
  const color = isRedSuit(suit) ? RED_SUIT_COLOR : 'black';
  const isSmall = size === 'small';
  const isTiny = size === 'tiny';

  return (
    <View
      style={[
        styles.card,
        isSmall && styles.cardSmall,
        isTiny && styles.cardTiny,
        isManilha && styles.cardManilha,
        highlight && styles.cardHighlight,
        dimmed && styles.cardDimmed,
      ]}
    >
      <Text
        style={[styles.value, isSmall && styles.valueSmall, isTiny && styles.valueTiny, { color }]}
      >
        {value}
      </Text>
      <Text
        style={[styles.suit, isSmall && styles.suitSmall, isTiny && styles.suitTiny, { color }]}
      >
        {suit}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: ms(44),
    height: ms(60),
    backgroundColor: '#FFF',
    borderRadius: ms(4),
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  cardSmall: { width: ms(40), height: ms(56) },
  cardTiny: { width: ms(36), height: ms(50) },
  cardManilha: { borderColor: '#FFD700', borderWidth: 2, backgroundColor: '#FFFDF0' },
  cardHighlight: { borderColor: '#333', borderWidth: 1.5 },
  cardDimmed: { opacity: 0.35 },
  value: { fontSize: ms(18), fontWeight: 'bold' },
  valueSmall: { fontSize: ms(16) },
  valueTiny: { fontSize: ms(14) },
  suit: { fontSize: ms(16) },
  suitSmall: { fontSize: ms(14) },
  suitTiny: { fontSize: ms(12) },
});
