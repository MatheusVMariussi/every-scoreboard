import { Fragment } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/useTheme';
import { translate } from '../../../i18n';
import { ms } from '../../../theme/responsive';
import { getRoundDamage, type PenaltyMode } from '../../../hooks/useFodinhaGame';
import { PlayingCard, RED_SUIT_COLOR, isRedSuit, type Suit } from '../../help/PlayingCard';
import { HelpLabel } from '../../help/HelpLayout';

/*
 * Exemplos do guia da Fodinha, desenhados como o placar de verdade (mesmas células, cores
 * e rótulos), para quem lê o guia já reconhecer a tela depois. Os nomes de exemplo
 * servem nos dois idiomas.
 */

// --- Objetivo: a mesa, como aparece no placar ---

const LIVES_EXAMPLE = [
  { name: 'ANA', lives: 3 },
  { name: 'LEO', lives: 1 },
  { name: 'BIA', lives: 0 },
] as const;

export const LivesExample = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.players}>
      {LIVES_EXAMPLE.map((player) => {
        const isOut = player.lives === 0;
        return (
          <View
            key={player.name}
            style={[styles.playerRow, { backgroundColor: theme.colors.truco.cardBackground }]}
          >
            <Text
              style={[styles.playerName, { color: theme.colors.text.white }, isOut && styles.out]}
            >
              {player.name}
            </Text>
            <View style={[styles.lives, isOut && styles.outLives]}>
              <Ionicons name="heart" size={ms(11)} color={theme.colors.status.error} />
              <Text style={[styles.livesValue, { color: theme.colors.text.white }]}>
                {player.lives}
              </Text>
            </View>
            {isOut && (
              <Text style={[styles.outTag, { color: theme.colors.fodinha.eliminated }]}>
                {translate('fodinha.eliminated')}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

// --- Apostas: a soma não pode fechar ---

const BET_EXAMPLE = {
  cards: 3,
  placed: [
    { name: 'ANA', bet: 1 },
    { name: 'LEO', bet: 0 },
  ],
  last: 'BIA',
} as const;

/** A aposta que fecharia a soma: a única que o último a apostar não pode fazer. */
const FORBIDDEN_BET =
  BET_EXAMPLE.cards - BET_EXAMPLE.placed.reduce((sum, player) => sum + player.bet, 0);

export const BetExample = () => {
  const { theme } = useTheme();
  const red = theme.colors.fodinha.damageText;
  const operatorStyle = [styles.operator, { color: theme.colors.text.secondary }];

  return (
    <View style={styles.betExample}>
      {/* O mesmo selo de cartas do cabeçalho do jogo. */}
      <View
        style={[
          styles.cardsBadge,
          {
            backgroundColor: theme.colors.fodinha.cardBackground,
            borderColor: theme.colors.fodinha.divider,
          },
        ]}
      >
        <Ionicons name="documents-outline" size={ms(11)} color={theme.colors.text.white} />
        <Text style={[styles.badgeText, { color: theme.colors.text.white }]}>
          {`${String(BET_EXAMPLE.cards)} ${translate('fodinha.cards')}`}
        </Text>
      </View>

      <View style={styles.equation}>
        {BET_EXAMPLE.placed.map((player) => (
          <Fragment key={player.name}>
            <BetChip name={player.name} value={player.bet} />
            <Text style={operatorStyle}>+</Text>
          </Fragment>
        ))}
        <BetChip name={BET_EXAMPLE.last} value={FORBIDDEN_BET} isForbidden />
        <Text style={operatorStyle}>=</Text>
        <Text style={[styles.sum, { color: red }]}>{BET_EXAMPLE.cards}</Text>
        <Ionicons name="close" size={ms(16)} color={red} />
      </View>

      <Text style={[styles.caption, { color: theme.colors.text.secondary }]}>
        {translate('fodinha.help.betting_example', {
          name: BET_EXAMPLE.last,
          bet: FORBIDDEN_BET,
          cards: BET_EXAMPLE.cards,
        })}
      </Text>
    </View>
  );
};

interface BetChipProps {
  name: string;
  value: number;
  /** A aposta que não pode: em vermelho e riscada. */
  isForbidden?: boolean;
}

const BetChip = ({ name, value, isForbidden = false }: BetChipProps) => {
  const { theme } = useTheme();
  const red = theme.colors.fodinha.damageText;

  return (
    <View style={styles.betChip}>
      <HelpLabel>{name}</HelpLabel>
      <View
        style={[
          styles.betBox,
          {
            backgroundColor: theme.colors.truco.cardBackground,
            borderColor: isForbidden ? red : theme.colors.truco.divider,
          },
        ]}
      >
        <Text
          style={[
            styles.betValue,
            { color: isForbidden ? red : theme.colors.text.white },
            isForbidden && styles.forbidden,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

// --- Pontuação: o mesmo cálculo do jogo ---

/** Acertou, errou para cima por 2, errou para baixo por 2. */
const SCORING_EXAMPLES = [
  { bet: 2, won: 2 },
  { bet: 1, won: 3 },
  { bet: 2, won: 0 },
] as const;

const PENALTY_COLUMNS: readonly PenaltyMode[] = ['fixed', 'difference'];

/** Mesmo rótulo das células do histórico no placar. */
const damageLabel = (damage: number): string => (damage === 0 ? 'OK' : `-${String(damage)}`);

/**
 * As duas punições lado a lado. Os valores vêm de `getRoundDamage`, a mesma conta que fecha
 * as rodadas: o guia não tem como ensinar uma regra diferente da do placar.
 */
export const PenaltyTable = () => {
  const { theme } = useTheme();
  const headers = [
    translate('fodinha.help.scoring_bet'),
    translate('fodinha.help.scoring_won'),
    translate('fodinha.fixed'),
    translate('fodinha.difference'),
  ];

  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        {headers.map((header) => (
          <View key={header} style={styles.tableCell}>
            <HelpLabel>{header}</HelpLabel>
          </View>
        ))}
      </View>
      {SCORING_EXAMPLES.map(({ bet, won }, index) => (
        <View
          key={`${String(bet)}-${String(won)}`}
          style={[
            styles.tableRow,
            styles.tableBodyRow,
            index % 2 === 0 && { backgroundColor: theme.colors.truco.cardBackground },
          ]}
        >
          <Text style={[styles.tableValue, { color: theme.colors.text.white }]}>{bet}</Text>
          <Text style={[styles.tableValue, { color: theme.colors.text.white }]}>{won}</Text>
          {PENALTY_COLUMNS.map((mode) => {
            const damage = getRoundDamage(bet, won, mode);
            return (
              <Text
                key={mode}
                style={[
                  styles.tableValue,
                  {
                    color:
                      damage === 0 ? theme.colors.status.success : theme.colors.fodinha.damageText,
                  },
                ]}
              >
                {damageLabel(damage)}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// --- Cartas ---

const RANKING: readonly { value: string; suit: Suit }[] = [
  { value: '3', suit: '♣' },
  { value: '2', suit: '♦' },
  { value: 'A', suit: '♠' },
  { value: 'K', suit: '♥' },
  { value: 'J', suit: '♣' },
  { value: 'Q', suit: '♦' },
  { value: '7', suit: '♠' },
  { value: '6', suit: '♥' },
  { value: '5', suit: '♣' },
  { value: '4', suit: '♦' },
];

export const CardRanking = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.ranking}>
      <View style={styles.rankingCards}>
        {RANKING.map((card) => (
          <PlayingCard key={card.value} value={card.value} suit={card.suit} size="tiny" />
        ))}
      </View>
      <View style={styles.scale}>
        <HelpLabel>{translate('fodinha.help.cards_strongest')}</HelpLabel>
        <View style={[styles.scaleLine, { backgroundColor: theme.colors.truco.divider }]} />
        <HelpLabel>{translate('fodinha.help.cards_weakest')}</HelpLabel>
      </View>
    </View>
  );
};

/** Do naipe mais forte para o mais fraco, no desempate. */
const SUIT_ORDER: readonly Suit[] = ['♦', '♠', '♥', '♣'];

export const SuitOrder = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.suits}>
      {SUIT_ORDER.map((suit, index) => (
        <Fragment key={suit}>
          {index > 0 && (
            <Ionicons name="chevron-forward" size={ms(12)} color={theme.colors.text.secondary} />
          )}
          <View style={styles.suitChip}>
            <Text style={[styles.suitGlyph, { color: isRedSuit(suit) ? RED_SUIT_COLOR : 'black' }]}>
              {suit}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
};

// --- Anulação: os dois 7 se anulam e o 4 leva ---

export const CancelOutExample = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.cancelOut}>
      <View style={styles.cancelGroup}>
        <View style={styles.cancelCards}>
          <PlayingCard value="7" suit="♠" size="small" dimmed />
          <Text style={[styles.operator, { color: theme.colors.text.secondary }]}>=</Text>
          <PlayingCard value="7" suit="♥" size="small" dimmed />
        </View>
        <HelpLabel>{translate('fodinha.help.cancel_label')}</HelpLabel>
      </View>
      <View style={styles.cancelGroup}>
        <PlayingCard value="4" suit="♦" size="small" />
        <HelpLabel color={theme.colors.truco.scoreText}>
          {translate('fodinha.help.cancel_wins')}
        </HelpLabel>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Objetivo
  players: { gap: ms(6) },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    width: ms(220),
    height: ms(32),
    paddingHorizontal: ms(12),
    borderRadius: ms(8),
  },
  playerName: { fontFamily: 'Minecraft', fontSize: ms(10), minWidth: ms(36) },
  out: { textDecorationLine: 'line-through', opacity: 0.5 },
  lives: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  outLives: { opacity: 0.5 },
  livesValue: { fontFamily: 'Minecraft', fontSize: ms(11) },
  outTag: { fontFamily: 'Minecraft', fontSize: ms(8), marginLeft: 'auto' },

  // Apostas
  betExample: { alignItems: 'center', gap: ms(10), maxWidth: ms(250) },
  cardsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    paddingHorizontal: ms(10),
    height: ms(24),
    borderRadius: ms(8),
    borderWidth: 1,
  },
  badgeText: { fontFamily: 'Minecraft', fontSize: ms(9) },
  equation: { flexDirection: 'row', alignItems: 'flex-end', gap: ms(6) },
  operator: { fontFamily: 'Minecraft', fontSize: ms(12), paddingBottom: ms(10) },
  sum: { fontFamily: 'Minecraft', fontSize: ms(14), paddingBottom: ms(9) },
  betChip: { alignItems: 'center', gap: ms(4) },
  betBox: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(8),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  betValue: { fontFamily: 'Minecraft', fontSize: ms(14) },
  forbidden: { textDecorationLine: 'line-through' },
  caption: { fontSize: ms(12), lineHeight: ms(17), textAlign: 'center', opacity: 0.8 },

  // Pontuação
  table: { alignSelf: 'center', width: '100%', maxWidth: ms(420) },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  tableBodyRow: { height: ms(28), borderRadius: ms(6) },
  tableCell: { flex: 1, alignItems: 'center', paddingVertical: ms(4) },
  tableValue: { flex: 1, textAlign: 'center', fontFamily: 'Minecraft', fontSize: ms(12) },

  // Cartas
  ranking: { alignSelf: 'center', gap: ms(8) },
  // 10 cartas de 36 com vão de 4: 396pt, cabe numa fileira até num iPhone SE deitado.
  // Sem `flexWrap`: o contêiner mede exatamente a fileira, e no arredondamento a última
  // carta passava por uma fração de ponto e descia para cima da escala.
  rankingCards: { flexDirection: 'row', gap: ms(4) },
  scale: { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  scaleLine: { flex: 1, height: 1 },
  suits: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  suitChip: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(6),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suitGlyph: { fontSize: ms(15) },

  // Anulação
  cancelOut: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(18) },
  cancelGroup: { alignItems: 'center', gap: ms(8) },
  cancelCards: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
});
