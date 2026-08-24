/**
 * Ciclo de vida do microfone.
 *
 * Duas formas de ouvir, um caminho só de código:
 * - `ptt`: segura o botão, fala, solta.
 * - `continuous`: fica aberto durante a rodada.
 *
 * A parte chata é o Android, que corta a sessão em segmentos e dispara `end` sozinho.
 * Para o modo contínuo funcionar, é preciso reabrir — com recuo progressivo, para um
 * erro repetido não virar um laço apertado.
 *
 * Desligar é tão importante quanto ligar: microfone aberto atrás de um app em segundo
 * plano é a pior versão da reclamação de bateria.
 */

import { useIsFocused } from '@react-navigation/native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { VoiceLocale } from './types';

export type VoiceMode = 'idle' | 'ptt' | 'continuous';

export type PermissionState = 'unknown' | 'granted' | 'denied';

/** Recuo progressivo entre reaberturas, em ms. */
const RESTART_BACKOFF_MS = [250, 500, 1000, 2000] as const;

/** Teto de reaberturas seguidas sem nenhum resultado, para não girar em falso. */
const MAX_CONSECUTIVE_RESTARTS = 6;

interface RestartInput {
  mode: VoiceMode;
  isFocused: boolean;
  isForeground: boolean;
  consecutiveRestarts: number;
}

/**
 * Decide se uma sessão encerrada deve reabrir. Puro de propósito: é a regra que mais
 * erra e a única parte deste módulo que dá para testar sem mock do nativo.
 */
export const shouldRestart = ({
  mode,
  isFocused,
  isForeground,
  consecutiveRestarts,
}: RestartInput): boolean =>
  mode === 'continuous' &&
  isFocused &&
  isForeground &&
  consecutiveRestarts < MAX_CONSECUTIVE_RESTARTS;

export const restartDelay = (consecutiveRestarts: number): number =>
  RESTART_BACKOFF_MS[Math.min(consecutiveRestarts, RESTART_BACKOFF_MS.length - 1)];

interface UseSpeechSessionOptions {
  mode: VoiceMode;
  /** Tag BCP-47 entregue ao reconhecedor nativo. Precisa casar com a gramática do parser. */
  locale: VoiceLocale;
  /** Nomes do placar, para enviesar o reconhecedor antes de errar. */
  contextualStrings: string[];
  onFinalTranscript: (transcript: string) => void;
  onError?: (code: string, message: string) => void;
}

export const useSpeechSession = ({
  mode,
  locale,
  contextualStrings,
  onFinalTranscript,
  onError,
}: UseSpeechSessionOptions) => {
  const isFocused = useIsFocused();

  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [interim, setInterim] = useState('');
  const [permission, setPermission] = useState<PermissionState>('unknown');

  // Refs porque os handlers de evento nativos leem estes valores fora do ciclo de render.
  const modeRef = useRef<VoiceMode>(mode);
  const focusedRef = useRef(isFocused);
  const foregroundRef = useRef(AppState.currentState === 'active');
  const restartsRef = useRef(0);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localeRef = useRef(locale);
  const contextRef = useRef(contextualStrings);
  const transcriptRef = useRef(onFinalTranscript);
  const errorRef = useRef(onError);

  modeRef.current = mode;
  focusedRef.current = isFocused;
  localeRef.current = locale;
  contextRef.current = contextualStrings;
  transcriptRef.current = onFinalTranscript;
  errorRef.current = onError;

  const clearRestartTimer = useCallback(() => {
    if (restartTimer.current !== null) {
      clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
  }, []);

  const beginSession = useCallback(() => {
    ExpoSpeechRecognitionModule.start({
      lang: localeRef.current,
      interimResults: true,
      continuous: modeRef.current === 'continuous',
      // Enviesar o reconhecedor com os nomes da mesa é o passo de maior alavancagem:
      // corrige antes de transcrever, em vez de remendar depois.
      contextualStrings: contextRef.current,
      requiresOnDeviceRecognition: true,
      addsPunctuation: false,
    });
  }, []);

  const stopSession = useCallback(() => {
    clearRestartTimer();
    restartsRef.current = 0;
    ExpoSpeechRecognitionModule.stop();
  }, [clearRestartTimer]);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    const current = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (current.granted) {
      setPermission('granted');
      return true;
    }
    const requested = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setPermission(requested.granted ? 'granted' : 'denied');
    return requested.granted;
  }, []);

  // --- Eventos nativos ---

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setInterim('');
    setVolume(0);

    if (
      !shouldRestart({
        mode: modeRef.current,
        isFocused: focusedRef.current,
        isForeground: foregroundRef.current,
        consecutiveRestarts: restartsRef.current,
      })
    ) {
      return;
    }

    const delay = restartDelay(restartsRef.current);
    restartsRef.current += 1;
    clearRestartTimer();
    restartTimer.current = setTimeout(beginSession, delay);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (!event.isFinal) {
      setInterim(transcript);
      return;
    }
    setInterim('');
    // Um resultado real significa que a sessão está saudável: zera o recuo.
    restartsRef.current = 0;
    if (transcript.trim().length > 0) transcriptRef.current(transcript);
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    setVolume(event.value);
  });

  useSpeechRecognitionEvent('error', (event) => {
    // "no-speech" é rotina em mesa silenciosa: não é erro para o usuário.
    if (event.error !== 'no-speech') {
      errorRef.current?.(event.error, event.message);
    }
  });

  // --- Gatilhos de ciclo de vida ---

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      const active = next === 'active';
      foregroundRef.current = active;
      if (!active) stopSession();
    });
    return () => {
      subscription.remove();
    };
  }, [stopSession]);

  useEffect(() => {
    if (!isFocused) stopSession();
  }, [isFocused, stopSession]);

  // Sair da tela sem desligar o microfone é o pior caso possível.
  useEffect(
    () => () => {
      clearRestartTimer();
      ExpoSpeechRecognitionModule.abort();
    },
    [clearRestartTimer],
  );

  const start = useCallback(async () => {
    const allowed = await ensurePermission();
    if (!allowed) return false;
    restartsRef.current = 0;
    beginSession();
    return true;
  }, [beginSession, ensurePermission]);

  return { isListening, volume, interim, permission, start, stop: stopSession };
};
