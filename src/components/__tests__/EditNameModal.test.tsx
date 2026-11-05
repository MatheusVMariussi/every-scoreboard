import type { ComponentProps } from 'react';
import { Text, TextInput } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { EditNameModal } from '../EditNameModal';
import { ThemeProvider } from '../../theme/ThemeContext';
import { translate } from '../../i18n';
import { MAX_LIVES } from '../../hooks/useFodinhaGame';

// O `expo-font` por trás dos ícones pede o `expo-asset`, que não resolve no Jest.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);

type Props = ComponentProps<typeof EditNameModal>;

// O modal agenda um `Keyboard.dismiss` ao abrir: desmontar limpa o timer antes de o
// ambiente do teste acabar.
const mounted: ReactTestRenderer[] = [];
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((renderer) => {
      renderer.unmount();
    });
  });
});

const render = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    visible: true,
    initialValue: 'JOGADOR 1',
    onSave: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };

  let renderer: ReactTestRenderer | undefined;
  act(() => {
    renderer = create(
      <ThemeProvider>
        <EditNameModal {...props} />
      </ThemeProvider>,
    );
  });
  if (!renderer) throw new Error('modal did not render');
  mounted.push(renderer);
  return { root: renderer.root, props };
};

const allText = (root: ReactTestInstance): string[] =>
  root.findAllByType(Text).map((node) => String(node.props.children));

/** O componente tocável mais interno que atende ao filtro (o fundo do modal também é tocável). */
const findPressable = (root: ReactTestInstance, matches: (node: ReactTestInstance) => boolean) => {
  const innermost = root
    .findAll((node) => typeof node.props.onPress === 'function' && matches(node))
    .at(-1);
  if (!innermost) throw new Error('no pressable found');
  return innermost;
};

const byText = (root: ReactTestInstance, text: string) =>
  findPressable(root, (node) =>
    node.findAll((child) => child.type === Text && child.props.children === text).some(Boolean),
  );

const byA11yLabel = (root: ReactTestInstance, label: string) =>
  findPressable(root, (node) => node.props.accessibilityLabel === label);

const press = (node: ReactTestInstance) => {
  act(() => {
    (node.props.onPress as () => void)();
  });
};

const livesLabel = () => translate('fodinha.lives');
const increaseLives = (root: ReactTestInstance) =>
  byA11yLabel(root, translate('a11y.increase', { item: livesLabel() }));
const decreaseLives = (root: ReactTestInstance) =>
  byA11yLabel(root, translate('a11y.decrease', { item: livesLabel() }));

const hasLivesControl = (root: ReactTestInstance) =>
  root.findAll(
    (node) =>
      node.props.accessibilityRole === 'adjustable' &&
      node.props.accessibilityLabel === livesLabel(),
  ).length > 0;

describe('EditNameModal', () => {
  it('only renames when no lives are given', () => {
    const { root, props } = render();

    expect(hasLivesControl(root)).toBe(false);
    expect(allText(root)).toContain(translate('common.edit_name'));

    act(() => {
      root.findByType(TextInput).props.onChangeText('Ana');
    });
    press(byText(root, translate('common.save')));

    expect(props.onSave).toHaveBeenCalledWith('Ana', undefined);
  });

  it('edits the lives together with the name', () => {
    const { root, props } = render({ initialLives: 2 });

    expect(allText(root)).toContain(translate('fodinha.edit_player'));

    press(increaseLives(root));
    press(increaseLives(root));
    press(byText(root, translate('common.save')));

    expect(props.onSave).toHaveBeenCalledWith('JOGADOR 1', 4);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('discards the lives change on cancel', () => {
    const { root, props } = render({ initialLives: 2 });

    press(decreaseLives(root));
    press(byText(root, translate('common.cancel')));

    expect(props.onSave).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it('can bring an eliminated player back but not below zero', () => {
    const { root, props } = render({ initialLives: 0 });

    expect(decreaseLives(root).props.disabled).toBe(true);

    press(increaseLives(root));
    press(byText(root, translate('common.save')));
    expect(props.onSave).toHaveBeenCalledWith('JOGADOR 1', 1);
  });

  it('stops at the lives limit', () => {
    const { root } = render({ initialLives: MAX_LIVES });

    expect(increaseLives(root).props.disabled).toBe(true);
  });
});
