import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';
import { HelpModalShell, type HelpStep } from './help/HelpModalShell';
import { PlayingCard, RED_SUIT_COLOR, isRedSuit, type Suit } from './help/PlayingCard';

interface TrucoHelpModalProps {
  visible: boolean;
  onClose: () => void;
  gameMode: 'paulista' | 'mineiro';
}

/** Ordem de força dos naipes para a manilha variável (paulista). */
const SUITS_ORDER: readonly { suit: Suit; name: string }[] = [
  { suit: '♣', name: 'PAUS' },
  { suit: '♥', name: 'COPAS' },
  { suit: '♠', name: 'ESPADA' },
  { suit: '♦', name: 'OURO' },
];

export const TrucoHelpModal = ({ visible, onClose, gameMode }: TrucoHelpModalProps) => {
  const { theme } = useTheme();
  const isPaulista = gameMode === 'paulista';

  const textStyle = [styles.text, { color: theme.colors.text.primary }];
  const subTitleStyle = [styles.subTitle, { color: theme.colors.text.primary }];
  const panelStyle = { backgroundColor: theme.colors.background.overlay };
  const rowPointStyle = [styles.rowPoint, { borderBottomColor: theme.colors.truco.divider }];
  const lblStyle = [styles.lbl, { color: theme.colors.text.secondary }];
  const valStyle = { color: theme.colors.text.primary };

  const steps: HelpStep[] = [
    {
      title: translate('truco.help.objective_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={textStyle}>
            {translate('truco.help.objective_text_1', { points: '12' })}
          </Text>
          <Text style={textStyle}>
            {translate('truco.help.objective_text_2', { points: isPaulista ? '1' : '2' })}
          </Text>
          <View style={styles.exampleRow}>
            <View style={[styles.miniScoreboard, panelStyle]}>
              <Text style={styles.miniScoreTitle}>{translate('truco.us')}</Text>
              <Text style={styles.miniScoreVal}>09</Text>
            </View>
            <Text style={[styles.vs, { color: theme.colors.text.secondary }]}>VS</Text>
            <View style={[styles.miniScoreboard, panelStyle]}>
              <Text style={styles.miniScoreTitle}>{translate('truco.them')}</Text>
              <Text style={styles.miniScoreVal}>11</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: translate('truco.help.cards_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={textStyle}>{translate('truco.help.cards_text')}</Text>
          <View style={styles.cardsRow}>
            <PlayingCard value="3" suit="♣" highlight />
            <PlayingCard value="2" suit="♦" />
            <PlayingCard value="A" suit="♠" />
            <PlayingCard value="K" suit="♥" />
            <PlayingCard value="J" suit="♣" />
          </View>
          <View style={styles.cardsRow}>
            <PlayingCard value="Q" suit="♦" />
            <PlayingCard value="7" suit="♠" />
            <PlayingCard value="6" suit="♥" />
            <PlayingCard value="5" suit="♣" />
            <PlayingCard value="4" suit="♦" />
          </View>
          <Text style={[styles.note, { color: theme.colors.text.secondary }]}>
            {translate('truco.help.cards_note')}
          </Text>
        </View>
      ),
    },
    {
      title: translate('truco.help.manilhas_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={textStyle}>{translate('truco.help.manilhas_text')}</Text>

          {isPaulista ? (
            <>
              <Text style={subTitleStyle}>{translate('truco.help.manilha_variable_title')}</Text>
              <Text style={textStyle}>{translate('truco.help.manilha_variable_text')}</Text>
              <View style={[styles.exampleBox, panelStyle]}>
                <Text style={[styles.exampleText, { color: theme.colors.text.primary }]}>
                  {translate('truco.help.manilha_example_if')}
                </Text>
                <PlayingCard value="A" suit="♥" />
                <Text style={[styles.exampleText, { color: theme.colors.text.primary }]}>
                  {translate('truco.help.manilha_example_is')}
                </Text>
                <PlayingCard value="2" suit="♣" isManilha />
              </View>
              <Text style={textStyle}>{translate('truco.help.suits_order')}</Text>
              <View style={styles.suitsOrder}>
                {SUITS_ORDER.map(({ suit, name }, i) => (
                  <View key={suit} style={styles.suitsOrderItem}>
                    {i > 0 && (
                      <Ionicons
                        name="chevron-forward"
                        size={ms(16)}
                        color={theme.colors.text.secondary}
                      />
                    )}
                    {/* Pílula branca: o naipe preto não aparece direto no fundo escuro. */}
                    <Text
                      style={[
                        styles.suitPill,
                        { color: isRedSuit(suit) ? RED_SUIT_COLOR : 'black' },
                      ]}
                    >
                      {suit} {name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={subTitleStyle}>{translate('truco.help.manilha_fixed_title')}</Text>
              <Text style={textStyle}>{translate('truco.help.manilha_fixed_text')}</Text>
              <View style={styles.cardsRow}>
                <PlayingCard value="4" suit="♣" isManilha />
                <PlayingCard value="7" suit="♥" isManilha />
                <PlayingCard value="A" suit="♠" isManilha />
                <PlayingCard value="7" suit="♦" isManilha />
              </View>
              <Text style={textStyle}>(Zap &gt; 7 Copas &gt; Espadilha &gt; 7 Ouros)</Text>
            </>
          )}
        </View>
      ),
    },
    {
      title: translate('truco.help.points_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={textStyle}>{translate('truco.help.points_text')}</Text>
          <View
            style={[styles.tablePoints, panelStyle, { borderColor: theme.colors.truco.divider }]}
          >
            <View style={rowPointStyle}>
              <Text style={lblStyle}>{translate('truco.help.points_table_hand')}</Text>
              <Text style={valStyle}>
                {isPaulista
                  ? translate('truco.help.tento_one')
                  : translate('truco.help.tentos', { count: 2 })}
              </Text>
            </View>
            <View style={rowPointStyle}>
              <Text style={lblStyle}>{translate('truco.help.points_table_truco')}</Text>
              <Text style={valStyle}>
                {translate('truco.help.tentos', { count: isPaulista ? 3 : 4 })}
              </Text>
            </View>
            <View style={rowPointStyle}>
              <Text style={lblStyle}>{translate('truco.help.points_table_six')}</Text>
              <Text style={valStyle}>
                {translate('truco.help.tentos', { count: isPaulista ? 6 : 8 })}
              </Text>
            </View>
            <View style={rowPointStyle}>
              <Text style={lblStyle}>{translate('truco.help.points_table_nine')}</Text>
              <Text style={valStyle}>
                {translate('truco.help.tentos', { count: isPaulista ? 9 : 10 })}
              </Text>
            </View>
            <View style={rowPointStyle}>
              <Text style={lblStyle}>{translate('truco.help.points_table_twelve')}</Text>
              <Text style={valStyle}>{translate('truco.help.tentos', { count: 12 })}</Text>
            </View>
          </View>
          <Text style={textStyle}>{translate('truco.help.points_refuse_text')}</Text>
        </View>
      ),
    },
  ];

  return (
    <HelpModalShell
      visible={visible}
      onClose={onClose}
      title={translate('truco.help.title')}
      steps={steps}
      widthRatio={0.95}
    />
  );
};

const styles = StyleSheet.create({
  stepContainer: { alignItems: 'center' },
  text: { fontSize: ms(16), lineHeight: ms(24), marginBottom: ms(15), textAlign: 'center' },
  note: { fontSize: ms(12), fontStyle: 'italic', marginTop: ms(10), textAlign: 'center' },
  subTitle: { fontSize: ms(18), fontWeight: 'bold', marginTop: ms(10), marginBottom: ms(5) },

  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: ms(8),
    marginBottom: ms(15),
  },

  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(15),
    marginTop: ms(10),
  },
  miniScoreboard: { alignItems: 'center', padding: ms(8), borderRadius: ms(6) },
  miniScoreTitle: { color: '#FFF', fontSize: ms(10), fontWeight: 'bold' },
  miniScoreVal: { color: '#FFF', fontSize: ms(20), fontWeight: 'bold' },
  vs: { fontSize: ms(16), fontWeight: 'bold' },

  exampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginVertical: ms(10),
    padding: ms(10),
    borderRadius: ms(8),
  },
  exampleText: { fontSize: ms(14) },

  suitsOrder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ms(5),
    marginTop: ms(5),
  },
  suitsOrderItem: { flexDirection: 'row', alignItems: 'center', gap: ms(5) },
  suitPill: {
    fontSize: ms(12),
    fontWeight: 'bold',
    backgroundColor: '#FFF',
    borderRadius: ms(6),
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    overflow: 'hidden',
  },

  tablePoints: { width: '100%', borderRadius: ms(8), padding: ms(10), borderWidth: 1 },
  rowPoint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ms(8),
    borderBottomWidth: 1,
  },
  lbl: { fontWeight: 'bold' },
});
