import type { ComponentProps } from 'react';
import { Alert, Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { FodinhaSettingsModal } from '../FodinhaSettingsModal';
import { ThemeProvider } from '../../theme/ThemeContext';
import { translate } from '../../i18n';
import { MAX_DECKS, MAX_LIVES, MIN_DECKS, MIN_LIVES } from '../../hooks/useFodinhaGame';

// O `expo-font` por trás dos ícones pede o `expo-asset`, que não resolve no Jest. Os
// testes procuram botões pelo rótulo de acessibilidade, não pelo ícone.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

type Props = ComponentProps<typeof FodinhaSettingsModal>;

const render = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    visible: true,
    onClose: jest.fn(),
    onReset: jest.fn(),
    onOpenHelp: jest.fn(),
    initialLives: 7,
    setInitialLives: jest.fn(),
    penaltyMode: 'fixed',
    setPenaltyMode: jest.fn(),
    deckCount: MIN_DECKS,
    setDeckCount: jest.fn(),
    maxCards: 13,
    livingCount: 3,
    ...overrides,
  };

  // O render só é aplicado quando o `act` termina: a árvore é lida depois dele.
  let renderer: ReactTestRenderer | undefined;
  act(() => {
    renderer = create(
      <ThemeProvider>
        <FodinhaSettingsModal {...props} />
      </ThemeProvider>,
    );
  });
  if (!renderer) throw new Error('modal did not render');
  return { root: renderer.root, props };
};

const allText = (root: ReactTestInstance): string[] =>
  root.findAllByType(Text).map((node) => String(node.props.children));

/** O componente tocável mais interno que atende ao filtro (o fundo do modal também é tocável). */
const findPressable = (
  root: ReactTestInstance,
  matches: (node: ReactTestInstance) => boolean,
): ReactTestInstance => {
  const found = root.findAll((node) => typeof node.props.onPress === 'function' && matches(node));
  const innermost = found.at(-1);
  if (!innermost) throw new Error('no pressable found');
  return innermost;
};

const byA11yLabel = (root: ReactTestInstance, label: string) =>
  findPressable(root, (node) => node.props.accessibilityLabel === label);

const byText = (root: ReactTestInstance, text: string) =>
  findPressable(root, (node) =>
    node.findAll((child) => child.type === Text && child.props.children === text).some(Boolean),
  );

const press = (node: ReactTestInstance) => {
  act(() => {
    (node.props.onPress as () => void)();
  });
};

/** Os botões − e + de um contador, pelo rótulo que dizem ao leitor de tela. */
const stepButtons = (root: ReactTestInstance, label: string) => ({
  decrease: byA11yLabel(root, translate('a11y.decrease', { item: label })),
  increase: byA11yLabel(root, translate('a11y.increase', { item: label })),
});

/** O contador inteiro como o leitor de tela o vê: um controle ajustável. */
const adjustable = (root: ReactTestInstance, label: string): ReactTestInstance => {
  const [node] = root.findAll(
    (n) => n.props.accessibilityRole === 'adjustable' && n.props.accessibilityLabel === label,
  );
  if (!node) throw new Error(`no adjustable control labelled "${label}"`);
  return node;
};

/** O gesto de ajuste do leitor de tela (deslizar para cima ou para baixo). */
const accessibilityAction = (node: ReactTestInstance, actionName: 'increment' | 'decrement') => {
  act(() => {
    (node.props.onAccessibilityAction as (event: object) => void)({ nativeEvent: { actionName } });
  });
};

const livesLabel = () => translate('fodinha.initial_lives');
const decksLabel = () => translate('fodinha.decks');

describe('FodinhaSettingsModal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the same settings title as the other games', () => {
    const { root } = render();

    expect(allText(root)).toContain(translate('settings.title'));
  });

  it('explains only the penalty that is selected', () => {
    const fixed = allText(render({ penaltyMode: 'fixed' }).root);
    expect(fixed).toContain(translate('fodinha.fixed_desc'));
    expect(fixed).not.toContain(translate('fodinha.difference_desc'));

    const difference = allText(render({ penaltyMode: 'difference' }).root);
    expect(difference).toContain(translate('fodinha.difference_desc'));
    expect(difference).not.toContain(translate('fodinha.fixed_desc'));
  });

  it('switches the penalty from its segment', () => {
    const { root, props } = render({ penaltyMode: 'fixed' });

    press(byA11yLabel(root, translate('fodinha.difference')));

    expect(props.setPenaltyMode).toHaveBeenCalledWith('difference');
  });

  it('marks the selected penalty for screen readers', () => {
    const { root } = render({ penaltyMode: 'difference' });

    expect(
      byA11yLabel(root, translate('fodinha.difference')).props.accessibilityState,
    ).toMatchObject({ checked: true });
    expect(byA11yLabel(root, translate('fodinha.fixed')).props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it('steps the initial lives both ways', () => {
    const { root, props } = render({ initialLives: 7 });

    press(stepButtons(root, livesLabel()).decrease);
    press(stepButtons(root, livesLabel()).increase);

    expect(props.setInitialLives).toHaveBeenNthCalledWith(1, 6);
    expect(props.setInitialLives).toHaveBeenNthCalledWith(2, 8);
  });

  it('blocks only the button that would leave the lives range', () => {
    const atMin = stepButtons(render({ initialLives: MIN_LIVES }).root, livesLabel());
    expect(atMin.decrease.props.disabled).toBe(true);
    expect(atMin.increase.props.disabled).toBe(false);

    const atMax = stepButtons(render({ initialLives: MAX_LIVES }).root, livesLabel());
    expect(atMax.increase.props.disabled).toBe(true);
    expect(atMax.decrease.props.disabled).toBe(false);
  });

  it('steps the decks and shows the card limit they allow', () => {
    const { root, props } = render({ deckCount: 2, livingCount: 3, maxCards: 26 });

    expect(allText(root)).toContain(translate('fodinha.max_cards_hint', { players: 3, max: 26 }));

    press(stepButtons(root, decksLabel()).decrease);
    press(stepButtons(root, decksLabel()).increase);
    expect(props.setDeckCount).toHaveBeenNthCalledWith(1, 1);
    expect(props.setDeckCount).toHaveBeenNthCalledWith(2, 3);

    expect(
      stepButtons(render({ deckCount: MIN_DECKS }).root, decksLabel()).decrease.props,
    ).toMatchObject({ disabled: true });
    expect(
      stepButtons(render({ deckCount: MAX_DECKS }).root, decksLabel()).increase.props,
    ).toMatchObject({ disabled: true });
  });

  it('reads each counter as one adjustable control', () => {
    const { root, props } = render({ initialLives: 7 });
    const lives = adjustable(root, livesLabel());

    expect(lives.props.accessibilityValue).toEqual({ text: '7' });

    accessibilityAction(lives, 'increment');
    accessibilityAction(lives, 'decrement');
    expect(props.setInitialLives).toHaveBeenNthCalledWith(1, 8);
    expect(props.setInitialLives).toHaveBeenNthCalledWith(2, 6);
  });

  it('ignores the adjust gesture past the limits', () => {
    const { root, props } = render({ initialLives: MAX_LIVES, deckCount: MIN_DECKS });

    accessibilityAction(adjustable(root, livesLabel()), 'increment');
    accessibilityAction(adjustable(root, decksLabel()), 'decrement');

    expect(props.setInitialLives).not.toHaveBeenCalled();
    expect(props.setDeckCount).not.toHaveBeenCalled();
  });

  it('asks before resetting the match', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { root, props } = render();

    press(byText(root, translate('common.reset_match')));

    expect(alert).toHaveBeenCalledWith(
      translate('common.confirm_reset_title'),
      translate('common.confirm_reset_message'),
      expect.any(Array),
    );
    expect(props.onReset).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('resets and closes once confirmed', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { root, props } = render();

    press(byText(root, translate('common.reset_match')));
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    const confirm = buttons.find((button) => button.style === 'destructive');
    act(() => {
      confirm?.onPress?.();
    });

    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the match when the reset is cancelled', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { root, props } = render();

    press(byText(root, translate('common.reset_match')));
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    const cancel = buttons.find((button) => button.style === 'cancel');
    act(() => {
      cancel?.onPress?.();
    });

    expect(cancel).toBeDefined();
    expect(props.onReset).not.toHaveBeenCalled();
  });

  it('opens the guide', () => {
    const { root, props } = render();

    press(byText(root, translate('common.how_to_play')));

    expect(props.onOpenHelp).toHaveBeenCalledTimes(1);
  });
});
