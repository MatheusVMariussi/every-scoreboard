import { useEffect, useState } from 'react';
import { getData, saveData } from '../utils/storage';

export interface UseGameTutorialOptions {
  /** Flag gravado quando o tutorial termina: com ele, o tutorial não abre mais. */
  storageKey: string;
  stepCount: number;
  /** O flag só é lido quando isto vira `true` (ex.: a tela terminou de girar). */
  isReady?: boolean;
  /** Espera extra antes de abrir, para os alvos do spotlight estarem no lugar final. */
  startDelayMs?: number;
}

export interface GameTutorial {
  isActive: boolean;
  step: number;
  isLastStep: boolean;
  /** Para o `useTutorialTarget` de cada passo: só o alvo do passo atual é medido. */
  isStepActive: (index: number) => boolean;
  /** Avança um passo; no último, fecha e grava o flag. */
  next: () => void;
}

/** Tutorial de primeira vez das telas de jogo: abre uma vez por instalação. */
export const useGameTutorial = ({
  storageKey,
  stepCount,
  isReady = true,
  startDelayMs = 0,
}: UseGameTutorialOptions): GameTutorial => {
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isReady) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void getData(storageKey).then((hasSeen) => {
      if (cancelled || hasSeen) return;
      timer = setTimeout(() => {
        setStep(0);
        setIsActive(true);
      }, startDelayMs);
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [isReady, storageKey, startDelayMs]);

  const isLastStep = step >= stepCount - 1;

  // `step + 1` e não a forma funcional: dois toques antes do próximo render avançam um
  // passo só, em vez de pular um.
  const next = () => {
    if (!isLastStep) {
      setStep(step + 1);
      return;
    }
    setIsActive(false);
    void saveData(storageKey, true);
  };

  return {
    isActive,
    step,
    isLastStep,
    isStepActive: (index: number) => isActive && step === index,
    next,
  };
};
