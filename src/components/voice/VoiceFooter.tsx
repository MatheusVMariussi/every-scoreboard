/**
 * Camada de voz que as duas telas de jogo montam.
 *
 * São dois pontos de montagem, de propósito:
 * - `VoiceFooter` vai **dentro do rodapé**: microfone à esquerda, pastilha da fila à
 *   direita, botão principal da tela intacto no centro. O rodapé das duas telas
 *   centraliza um botão de largura fixa numa faixa larga em paisagem, então as laterais
 *   já eram espaço morto.
 * - `VoicePanel` vai na **raiz da tela**, junto dos outros overlays. No Android um filho
 *   desenhado fora dos limites do pai não recebe toque, e o painel é bem mais alto que o
 *   rodapé.
 *
 * O rodapé também é o dono do portão do aviso: ligar o modo sempre ouvindo passa aqui.
 */

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getLocale } from '../../i18n';
import { ms } from '../../theme/responsive';
import { useTheme } from '../../theme/useTheme';
import { loadSettings, updateSettings } from '../../utils/appSettings';
import type { RosterPlayer, VoiceLocale } from '../../voice/types';
import type { useVoiceScoring } from '../../voice/useVoiceScoring';
import { PendingPanel, PendingPill } from './PendingQueueDock';
import { VoiceMicControls } from './VoiceMicButton';
import { VoiceWarningModal } from './VoiceWarningModal';

/**
 * Idioma do app -> idioma da voz. São tags diferentes de propósito: o app grava 'en', e
 * tanto o reconhecedor nativo quanto a gramática querem a tag completa 'en-US'.
 *
 * `translate` é imperativo e não há contexto de i18n, então trocar o idioma nas
 * configurações não re-renderiza telas já montadas: a escolha vale no momento da
 * montagem. Aceitável enquanto a troca de idioma acontece na Home.
 */
export const getVoiceLocale = (): VoiceLocale => (getLocale() === 'pt-BR' ? 'pt-BR' : 'en-US');

interface Props {
  voice: ReturnType<typeof useVoiceScoring>;
  players: RosterPlayer[];
}

export const VoiceFooter = ({ voice, players }: Props) => {
  const { theme } = useTheme();
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    void loadSettings().then((settings) => {
      if (active) setWarningDismissed(settings.voiceWarningDismissed);
    });
    return () => {
      active = false;
    };
  }, []);

  const alwaysOn = voice.mode === 'continuous';

  const handleToggleAlwaysOn = useCallback(() => {
    if (alwaysOn) {
      voice.stopContinuous();
      return;
    }
    // O aviso reaparece a cada ativação até o usuário pedir para parar de avisar.
    if (!warningDismissed) {
      setWarningVisible(true);
      return;
    }
    void voice.startContinuous();
  }, [alwaysOn, voice, warningDismissed]);

  const handleConfirmWarning = useCallback(
    (dontWarnAgain: boolean) => {
      setWarningVisible(false);
      if (dontWarnAgain) {
        setWarningDismissed(true);
        void updateSettings({ voiceWarningDismissed: true });
      }
      void voice.startContinuous();
    },
    [voice],
  );

  const handlePressIn = useCallback(() => {
    if (alwaysOn) return;
    void voice.startPushToTalk();
  }, [alwaysOn, voice]);

  return (
    <>
      <View style={styles.left} pointerEvents="box-none">
        <VoiceMicControls
          mode={voice.mode}
          isListening={voice.isListening}
          volume={voice.volume}
          colors={theme.colors}
          onPressIn={handlePressIn}
          onPressOut={voice.stopPushToTalk}
          onToggleAlwaysOn={handleToggleAlwaysOn}
        />
      </View>

      <View style={styles.right} pointerEvents="box-none">
        {!voice.panelOpen && (
          <PendingPill pending={voice.pending} colors={theme.colors} onPress={voice.openPanel} />
        )}
      </View>

      <VoiceWarningModal
        visible={warningVisible}
        onCancel={() => {
          setWarningVisible(false);
        }}
        onConfirm={handleConfirmWarning}
      />
    </>
  );
};

/** Renderizar na raiz da tela, ao lado dos outros overlays absolutos. */
export const VoicePanel = ({ voice, players }: Props) => {
  const { theme } = useTheme();
  // Aberto por padrão, mas some sozinho quando não há nada para aprovar.
  if (!voice.panelOpen || voice.count === 0) return null;

  return (
    <PendingPanel
      pending={voice.pending}
      players={players}
      colors={theme.colors}
      onClose={voice.closePanel}
      onApply={voice.apply}
      onClear={voice.clear}
      onRemoveEntry={voice.dismissEntry}
      onAssignUnresolved={voice.assignUnresolved}
      onDismissUnresolved={voice.dismissUnresolved}
    />
  );
};

const styles = StyleSheet.create({
  // Ancorados nas bordas do rodapé; o botão principal continua centralizado entre eles.
  left: { position: 'absolute', left: ms(20), bottom: ms(5) },
  right: { position: 'absolute', right: ms(20), bottom: ms(5) },
});
