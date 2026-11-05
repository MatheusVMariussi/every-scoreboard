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
  size?: 'regular' | 'small';
}

/** Carta de baralho desenhada nos guias de "como jogar". */
export const PlayingCard = ({
  value,
  suit,
  isManilha = false,
  highlight = false,
  size = 'regular',
}: PlayingCardProps) => {
  const color = isRedSuit(suit) ? RED_SUIT_COLOR : 'black';
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.card,
        isSmall && styles.cardSmall,
        isManilha && styles.cardManilha,
        highlight && styles.cardHighlight,
      ]}
    >
      <Text style={[styles.value, isSmall && styles.valueSmall, { color }]}>{value}</Text>
      <Text style={[styles.suit, isSmall && styles.suitSmall, { color }]}>{suit}</Text>
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
  cardManilha: { borderColor: '#FFD700', borderWidth: 2, backgroundColor: '#FFFDF0' },
  cardHighlight: { borderColor: '#333', borderWidth: 1.5 },
  value: { fontSize: ms(18), fontWeight: 'bold' },
  valueSmall: { fontSize: ms(16) },
  suit: { fontSize: ms(16) },
  suitSmall: { fontSize: ms(14) },
});
