import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useAutoSave } from '../useAutoSave';
import { saveData } from '../../utils/storage';

jest.mock('../../utils/storage', () => ({ saveData: jest.fn() }));

const KEY = '@test_key';

interface ProbeProps {
  snapshot: unknown;
  isLoaded: boolean;
}

const Probe = ({ snapshot, isLoaded }: ProbeProps) => {
  useAutoSave(KEY, snapshot, isLoaded);
  return null;
};

const mount = (props: ProbeProps) => {
  let renderer: ReactTestRenderer | undefined;
  act(() => {
    renderer = create(<Probe {...props} />);
  });
  return {
    update: (next: ProbeProps) => {
      act(() => {
        renderer?.update(<Probe {...next} />);
      });
    },
  };
};

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.mocked(saveData).mockClear();
  });

  it('does not save while the stored state is still loading', () => {
    const probe = mount({ snapshot: { score: 0 }, isLoaded: false });
    probe.update({ snapshot: { score: 1 }, isLoaded: false });

    expect(saveData).not.toHaveBeenCalled();
  });

  it('does not write back the state that loading produced', () => {
    // É o que acabou de ser lido, ou o padrão depois de uma leitura que falhou: gravar
    // qualquer um dos dois seria inútil ou apagaria o save que ainda está no disco.
    const probe = mount({ snapshot: { score: 0 }, isLoaded: false });
    probe.update({ snapshot: { score: 7 }, isLoaded: true });

    expect(saveData).not.toHaveBeenCalled();
  });

  it('saves every change made after loading', () => {
    const probe = mount({ snapshot: { score: 7 }, isLoaded: false });
    probe.update({ snapshot: { score: 7 }, isLoaded: true });
    probe.update({ snapshot: { score: 8 }, isLoaded: true });
    probe.update({ snapshot: { score: 9 }, isLoaded: true });

    expect(saveData).toHaveBeenCalledTimes(2);
    expect(saveData).toHaveBeenNthCalledWith(1, KEY, { score: 8 });
    expect(saveData).toHaveBeenNthCalledWith(2, KEY, { score: 9 });
  });

  it('does not save again when re-rendered with the same snapshot', () => {
    const snapshot = { score: 7 };
    const probe = mount({ snapshot, isLoaded: false });
    probe.update({ snapshot, isLoaded: true });
    probe.update({ snapshot, isLoaded: true });

    expect(saveData).not.toHaveBeenCalled();
  });
});
