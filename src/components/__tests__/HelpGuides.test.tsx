import type { ComponentType } from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { TrucoHelpModal } from '../TrucoHelpModal';
import { CachetaHelpModal } from '../CachetaHelpModal';
import { ThemeProvider } from '../../theme/ThemeContext';
import { translate } from '../../i18n';

// O `expo-font` por trás dos ícones pede o `expo-asset`, que não resolve no Jest.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

interface GuideProps {
  visible: boolean;
  onClose: () => void;
}

/** O componente tocável mais interno com este texto (o fundo do modal também é tocável). */
const findPressable = (root: ReactTestInstance, text: string) =>
  root
    .findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        node.findAll((child) => child.type === Text && child.props.children === text).length > 0,
    )
    .at(-1);

// Os três guias dividem a moldura: os outros dois têm de continuar navegáveis do começo
// ao fim com ela.
describe.each<[string, ComponentType<GuideProps>]>([
  ['Truco', TrucoHelpModal],
  ['Cacheta', CachetaHelpModal],
])('%s guide in the shared frame', (_name, Guide) => {
  it('walks to the last step and closes', () => {
    const onClose = jest.fn();
    let renderer: ReactTestRenderer | undefined;
    act(() => {
      renderer = create(
        <ThemeProvider>
          <Guide visible onClose={onClose} />
        </ThemeProvider>,
      );
    });
    if (!renderer) throw new Error('guide did not render');
    const { root } = renderer;

    // Avança até o botão virar "entendido"; o limite só evita laço infinito se quebrar.
    for (let step = 0; step < 20; step += 1) {
      const next = findPressable(root, translate('common.next'));
      if (!next) break;
      act(() => {
        (next.props.onPress as () => void)();
      });
    }

    const done = findPressable(root, translate('common.got_it'));
    expect(done).toBeDefined();
    act(() => {
      (done?.props.onPress as () => void)();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
