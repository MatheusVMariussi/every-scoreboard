import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import ptBR from './pt-BR';
import en from './en';

/** Os idiomas que o app realmente traduz. A escolha do usuário é gravada nesta forma. */
export type AppLocale = 'pt-BR' | 'en';

const i18n = new I18n({
  'pt-BR': ptBR,
  'en-US': en,
  en: en,
});

i18n.enableFallback = true;

/**
 * Reduz uma tag BCP-47 do dispositivo (`pt-BR`, `en-US`, `pt-PT`…) a um dos idiomas que
 * traduzimos. Gravar a forma canônica evita que "qual idioma está ativo" dependa de
 * comparação por substring.
 */
export const normalizeLocale = (tag: string): AppLocale =>
  tag.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';

export const getDeviceLocale = (): AppLocale =>
  normalizeLocale(getLocales()[0]?.languageTag ?? 'en');

export const setLocale = (locale: AppLocale): void => {
  i18n.locale = locale;
};

export const getLocale = (): AppLocale => normalizeLocale(i18n.locale);

/**
 * Idioma do dispositivo como ponto de partida. O `App` aplica a preferência gravada
 * antes do primeiro render — se houver uma, ela substitui esta.
 */
setLocale(getDeviceLocale());

export default i18n;

// Wrapper tipado para evitar uso de strings mágicas no futuro se quiser evoluir
export const translate = (key: string, options?: object) => i18n.t(key, options);
