import { Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { FodinhaHelpModal } from '../FodinhaHelpModal';
import { ThemeProvider } from '../../theme/ThemeContext';
import { translate } from '../../i18n';

// O `expo-font` por trás dos ícones pede o `expo-asset`, que não resolve no Jest.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const STEP_TITLES = [
  'fodinha.help.objective_title',
  'fodinha.help.betting_title',
  'fodinha.help.scoring_title',
  'fodinha.help.cards_title',
  'fodinha.help.cancel_title',
];

const render = (visible = true) => {
  const onClose = jest.fn();
  let renderer: ReactTestRenderer | undefined;
  act(() => {
    renderer = create(
      <ThemeProvider>
        <FodinhaHelpModal visible={visible} onClose={onClose} />
      </ThemeProvider>,
    );
  });
  if (!renderer) throw new Error('guide did not render');
  const mounted = renderer;
  return {
    root: () => mounted.root,
    onClose,
    setVisible: (next: boolean) => {
      act(() => {
        mounted.update(
          <ThemeProvider>
            <FodinhaHelpModal visible={next} onClose={onClose} />
          </ThemeProvider>,
        );
      });
    },
  };
};

const allText = (root: ReactTestInstance): string[] =>
  root.findAllByType(Text).map((node) => {
    const { children } = node.props as { children: unknown };
    return Array.isArray(children) ? children.join('') : String(children);
  });

/** O componente tocável mais interno com este texto (o fundo do modal também é tocável). */
const pressText = (root: ReactTestInstance, text: string) => {
  const target = root
    .findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        node.findAll((child) => child.type === Text && child.props.children === text).length > 0,
    )
    .at(-1);
  if (!target) throw new Error(`nothing to press with "${text}"`);
  act(() => {
    (target.props.onPress as () => void)();
  });
};

const next = (root: ReactTestInstance) => {
  pressText(root, translate('common.next'));
};

describe('FodinhaHelpModal', () => {
  it('walks through every step in order and closes on the last one', () => {
    const guide = render();

    STEP_TITLES.forEach((key, index) => {
      expect(allText(guide.root())).toContain(translate(key));
      if (index < STEP_TITLES.length - 1) next(guide.root());
    });

    pressText(guide.root(), translate('common.got_it'));
    expect(guide.onClose).toHaveBeenCalledTimes(1);
  });

  it('goes back a step', () => {
    const guide = render();

    next(guide.root());
    pressText(guide.root(), translate('common.previous'));

    expect(allText(guide.root())).toContain(translate(STEP_TITLES[0]));
  });

  it('cannot go back from the first step', () => {
    const guide = render();
    const back = guide
      .root()
      .findAll(
        (node) =>
          typeof node.props.onPress === 'function' &&
          node
            .findAll((child) => child.type === Text)
            .some((child) => child.props.children === translate('common.previous')),
      )
      .at(-1);

    expect(back?.props.disabled).toBe(true);
  });

  it('starts over from the first step when reopened', () => {
    const guide = render();
    next(guide.root());
    next(guide.root());

    guide.setVisible(false);
    guide.setVisible(true);

    expect(allText(guide.root())).toContain(translate(STEP_TITLES[0]));
  });

  it('shows which bet the last player cannot make', () => {
    const guide = render();
    next(guide.root());

    expect(allText(guide.root())).toContain(
      translate('fodinha.help.betting_example', { name: 'BIA', bet: 2, cards: 3 }),
    );
  });

  it('scores the examples with the same rules as the game', () => {
    const guide = render();
    next(guide.root());
    next(guide.root());

    const text = allText(guide.root());
    // Errou por 2: perde 1 na fixa e 2 pela diferença. Acertou: OK nas duas.
    expect(text).toEqual(expect.arrayContaining(['OK', '-1', '-2']));
    expect(text).toContain(translate('fodinha.fixed'));
    expect(text).toContain(translate('fodinha.difference'));
  });
});
