import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  useGameTutorial,
  type GameTutorial,
  type UseGameTutorialOptions,
} from '../useGameTutorial';

const KEY = '@tutorial_test';
const DELAY_MS = 500;

let latest: GameTutorial | undefined;

const Probe = (options: UseGameTutorialOptions) => {
  latest = useGameTutorial(options);
  return null;
};

const current = (): GameTutorial => {
  if (!latest) throw new Error('Probe never rendered');
  return latest;
};

/** Monta e deixa a leitura do flag (uma Promise) terminar. */
const mount = async (options: UseGameTutorialOptions) => {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(<Probe {...options} />);
  });
  return {
    update: async (next: UseGameTutorialOptions) => {
      await act(async () => {
        renderer?.update(<Probe {...next} />);
      });
    },
  };
};

const advance = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const pressNext = async () => {
  await act(async () => {
    current().next();
  });
};

describe('useGameTutorial', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    latest = undefined;
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens on the first step when the tutorial was never seen', async () => {
    await mount({ storageKey: KEY, stepCount: 2 });
    advance(0);

    expect(current().isActive).toBe(true);
    expect(current().step).toBe(0);
  });

  it('stays closed once the tutorial was seen', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(true));
    await mount({ storageKey: KEY, stepCount: 2, startDelayMs: DELAY_MS });
    advance(DELAY_MS);

    expect(current().isActive).toBe(false);
  });

  it('waits for isReady, then for the start delay', async () => {
    const options = { storageKey: KEY, stepCount: 2, startDelayMs: DELAY_MS };
    const probe = await mount({ ...options, isReady: false });
    advance(DELAY_MS);
    expect(current().isActive).toBe(false);

    await probe.update({ ...options, isReady: true });
    advance(DELAY_MS - 1);
    expect(current().isActive).toBe(false);

    advance(1);
    expect(current().isActive).toBe(true);
  });

  it('walks the steps and marks the tutorial as seen after the last one', async () => {
    await mount({ storageKey: KEY, stepCount: 2 });
    advance(0);
    expect(current().isStepActive(0)).toBe(true);
    expect(current().isLastStep).toBe(false);

    await pressNext();
    expect(current().step).toBe(1);
    expect(current().isStepActive(0)).toBe(false);
    expect(current().isStepActive(1)).toBe(true);
    expect(current().isLastStep).toBe(true);

    await pressNext();
    expect(current().isActive).toBe(false);
    expect(current().isStepActive(1)).toBe(false);
    expect(await AsyncStorage.getItem(KEY)).toBe('true');
  });

  it('does not skip a step when next is pressed twice before re-rendering', async () => {
    await mount({ storageKey: KEY, stepCount: 3 });
    advance(0);

    await act(async () => {
      const { next } = current();
      next();
      next();
    });

    expect(current().step).toBe(1);
    expect(current().isActive).toBe(true);
  });

  it('cancels the pending start when it stops being ready', async () => {
    // Mesmo cleanup do unmount, mas com a tela ainda montada para dar o que observar.
    const options = { storageKey: KEY, stepCount: 2, startDelayMs: DELAY_MS };
    const probe = await mount({ ...options, isReady: true });

    await probe.update({ ...options, isReady: false });
    advance(DELAY_MS);

    expect(current().isActive).toBe(false);
  });
});
