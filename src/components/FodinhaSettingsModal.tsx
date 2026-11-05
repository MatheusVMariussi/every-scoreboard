import { useWindowDimensions } from 'react-native';
import { translate } from '../i18n';
import { ms } from '../theme/responsive';
import {
  MAX_DECKS,
  MAX_LIVES,
  MIN_DECKS,
  MIN_LIVES,
  type PenaltyMode,
} from '../hooks/useFodinhaGame';
import { SettingsModalShell } from './settings/SettingsModalShell';
import { SettingRow } from './settings/SettingRow';
import { Stepper } from './settings/Stepper';
import { SegmentedControl, type SegmentOption } from './settings/SegmentedControl';

/**
 * A largura segue o `ms()` do conteúdo, não a tela: em tablet tudo cresce na mesma
 * proporção e as linhas continuam cabendo. A fração da tela só manda em aparelho estreito.
 */
const MAX_WIDTH = ms(540);
const SCREEN_WIDTH_RATIO = 0.9;

interface FodinhaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
  initialLives: number;
  setInitialLives: (lives: number) => void;
  penaltyMode: PenaltyMode;
  setPenaltyMode: (mode: PenaltyMode) => void;
  deckCount: number;
  setDeckCount: (count: number) => void;
  /** Limite de cartas por jogador com os baralhos e os vivos de agora. */
  maxCards: number;
  livingCount: number;
}

/**
 * Uma opção por linha, regras primeiro (vidas e punição) e a mesa por último (baralhos,
 * que dependem de quantos jogam). Cada linha diz em texto o efeito do valor atual.
 */
export const FodinhaSettingsModal = ({
  visible,
  onClose,
  onReset,
  onOpenHelp,
  initialLives,
  setInitialLives,
  penaltyMode,
  setPenaltyMode,
  deckCount,
  setDeckCount,
  maxCards,
  livingCount,
}: FodinhaSettingsModalProps) => {
  const { width } = useWindowDimensions();

  const livesLabel = translate('fodinha.initial_lives');
  const penaltyLabel = translate('fodinha.penalty_mode');
  const decksLabel = translate('fodinha.decks');

  const penaltyOptions: SegmentOption<PenaltyMode>[] = [
    { value: 'fixed', label: translate('fodinha.fixed') },
    { value: 'difference', label: translate('fodinha.difference') },
  ];

  return (
    <SettingsModalShell
      visible={visible}
      onClose={onClose}
      title={translate('settings.title')}
      onOpenHelp={onOpenHelp}
      onReset={onReset}
      width={Math.min(width * SCREEN_WIDTH_RATIO, MAX_WIDTH)}
      compact
    >
      <SettingRow label={livesLabel}>
        <Stepper
          label={livesLabel}
          value={initialLives}
          canDecrease={initialLives > MIN_LIVES}
          canIncrease={initialLives < MAX_LIVES}
          onChange={(delta) => {
            setInitialLives(Math.max(MIN_LIVES, Math.min(MAX_LIVES, initialLives + delta)));
          }}
        />
      </SettingRow>

      <SettingRow
        divided
        label={penaltyLabel}
        description={translate(
          penaltyMode === 'fixed' ? 'fodinha.fixed_desc' : 'fodinha.difference_desc',
        )}
      >
        <SegmentedControl
          label={penaltyLabel}
          options={penaltyOptions}
          value={penaltyMode}
          onChange={setPenaltyMode}
        />
      </SettingRow>

      <SettingRow
        divided
        label={decksLabel}
        description={translate('fodinha.max_cards_hint', { players: livingCount, max: maxCards })}
      >
        <Stepper
          label={decksLabel}
          value={deckCount}
          canDecrease={deckCount > MIN_DECKS}
          canIncrease={deckCount < MAX_DECKS}
          onChange={(delta) => {
            setDeckCount(deckCount + delta);
          }}
        />
      </SettingRow>
    </SettingsModalShell>
  );
};
