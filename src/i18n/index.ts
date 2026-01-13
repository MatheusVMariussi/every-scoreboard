import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import ptBR from './pt-BR';
import en from './en';

const i18n = new I18n({
  'pt-BR': ptBR,
  'en-US': en,
  en: en,
});

// Configuração inicial baseada no dispositivo
i18n.enableFallback = true;
i18n.locale = getLocales()[0].languageTag;

export default i18n;

// Wrapper tipado para evitar uso de strings mágicas no futuro se quiser evoluir
export const translate = (key: string, options?: object) => i18n.t(key, options);