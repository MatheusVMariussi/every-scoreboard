import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSettings, updateSettings } from '../appSettings';
import { STORAGE_KEYS } from '../storage';

const writeRaw = async (value: unknown) => {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(value));
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('loadSettings', () => {
  it('returns null preferences when nothing was ever saved', async () => {
    const settings = await loadSettings();

    // `null` é o que faz o app seguir o aparelho — não confundir com um padrão fixo.
    expect(settings.locale).toBeNull();
    expect(settings.themeMode).toBeNull();
    expect(settings.voiceWarningDismissed).toBe(false);
  });

  it('reads back a saved locale and theme', async () => {
    await writeRaw({ locale: 'en', themeMode: 'dark', voiceWarningDismissed: true });

    const settings = await loadSettings();

    expect(settings.locale).toBe('en');
    expect(settings.themeMode).toBe('dark');
    expect(settings.voiceWarningDismissed).toBe(true);
  });

  it('falls back to following the system when a stored value is unrecognized', async () => {
    // Uma versão anterior gravava a tag crua do aparelho.
    await writeRaw({ locale: 'en-US', themeMode: 'sepia' });

    const settings = await loadSettings();

    expect(settings.locale).toBeNull();
    expect(settings.themeMode).toBeNull();
  });

  it('survives a corrupted payload', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, 'not json');

    await expect(loadSettings()).resolves.toEqual({
      voiceWarningDismissed: false,
      locale: null,
      themeMode: null,
    });
  });
});

describe('updateSettings', () => {
  it('persists the locale across a reload', async () => {
    await updateSettings({ locale: 'en' });

    await expect(loadSettings()).resolves.toMatchObject({ locale: 'en' });
  });

  it('preserves the other preferences when patching one', async () => {
    await updateSettings({ locale: 'en', voiceWarningDismissed: true });
    await updateSettings({ themeMode: 'dark' });

    const settings = await loadSettings();

    expect(settings.locale).toBe('en');
    expect(settings.voiceWarningDismissed).toBe(true);
    expect(settings.themeMode).toBe('dark');
  });

  it('lets a later choice replace an earlier one', async () => {
    await updateSettings({ locale: 'en' });
    await updateSettings({ locale: 'pt-BR' });

    await expect(loadSettings()).resolves.toMatchObject({ locale: 'pt-BR' });
  });
});
