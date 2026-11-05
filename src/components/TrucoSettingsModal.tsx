import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { ms, wp } from '../theme/responsive';
import { SettingsModalShell } from './settings/SettingsModalShell';
import { OptionButton } from './settings/OptionButton';

interface TrucoSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
  gameMode: 'paulista' | 'mineiro';
  setGameMode: (mode: 'paulista' | 'mineiro') => void;
  maxScore: number;
  setMaxScore: (score: number) => void;
}

export const TrucoSettingsModal = ({
  visible,
  onClose,
  onReset,
  onOpenHelp,
  gameMode,
  setGameMode,
  maxScore,
  setMaxScore,
}: TrucoSettingsModalProps) => {
  const { theme } = useTheme();
  const labelStyle = [styles.label, { color: theme.colors.text.secondary }];

  return (
    <SettingsModalShell
      visible={visible}
      onClose={onClose}
      title={translate('settings.title')}
      onOpenHelp={onOpenHelp}
      onReset={onReset}
      width={Math.min(wp('85%'), ms(500))}
    >
      {/* MODO DE JOGO */}
      <View style={styles.section}>
        <Text style={labelStyle}>{translate('truco.game_mode')}</Text>
        <View style={styles.row}>
          <OptionButton
            label={translate('truco.paulista').toUpperCase()}
            active={gameMode === 'paulista'}
            onPress={() => {
              setGameMode('paulista');
            }}
          />
          <OptionButton
            label={translate('truco.mineiro').toUpperCase()}
            active={gameMode === 'mineiro'}
            onPress={() => {
              setGameMode('mineiro');
            }}
          />
        </View>
      </View>

      {/* PONTUAÇÃO MÁXIMA */}
      <View style={styles.section}>
        <Text style={labelStyle}>{translate('truco.max_score')}</Text>
        <View style={styles.row}>
          <OptionButton
            label={translate('common.points_12')}
            active={maxScore === 12}
            onPress={() => {
              setMaxScore(12);
            }}
          />
          <OptionButton
            label={translate('common.points_24')}
            active={maxScore === 24}
            onPress={() => {
              setMaxScore(24);
            }}
          />
        </View>
      </View>
    </SettingsModalShell>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: ms(20) },
  label: { fontSize: ms(10), fontFamily: 'Minecraft', marginBottom: ms(10), opacity: 0.7 },
  row: { flexDirection: 'row', gap: ms(10) },
});
