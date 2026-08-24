/**
 * Preferências do app, gravadas em `STORAGE_KEYS.SETTINGS`.
 *
 * A chave já existia declarada mas nunca era lida nem escrita. Guardamos um objeto (e
 * não um booleano solto) para que novas preferências entrem aqui sem migração.
 *
 * `locale` e `themeMode` são `null` enquanto o usuário nunca escolheu — só nesse caso o
 * app segue o sistema. Uma escolha explícita **substitui** o sistema e vale até ser
 * trocada de novo, mesmo que o idioma ou o tema do aparelho mudem depois.
 */

import type { AppLocale } from '../i18n';
import { getData, saveData, STORAGE_KEYS } from './storage';

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  /** `true` depois que o usuário marca "não avisar novamente" no aviso de voz. */
  voiceWarningDismissed: boolean;
  /** Idioma escolhido pelo usuário; `null` = ainda seguindo o do aparelho. */
  locale: AppLocale | null;
  /** Tema escolhido pelo usuário; `null` = ainda seguindo o do aparelho. */
  themeMode: ThemeMode | null;
}

const DEFAULTS: AppSettings = {
  voiceWarningDismissed: false,
  locale: null,
  themeMode: null,
};

const LOCALES: readonly AppLocale[] = ['pt-BR', 'en'];
const THEME_MODES: readonly ThemeMode[] = ['light', 'dark'];

/**
 * O que está no disco foi gravado por uma versão anterior do app e não é confiável:
 * valida cada campo antes de aceitar, caindo no padrão quando não reconhecer.
 */
const asLocale = (value: unknown): AppLocale | null =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
    ? (value as AppLocale)
    : null;

const asThemeMode = (value: unknown): ThemeMode | null =>
  typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value)
    ? (value as ThemeMode)
    : null;

/** Lê as preferências, caindo no padrão para qualquer campo ausente ou inválido. */
export const loadSettings = async (): Promise<AppSettings> => {
  const saved = (await getData(STORAGE_KEYS.SETTINGS)) as Partial<AppSettings> | null;
  if (saved === null || typeof saved !== 'object') return DEFAULTS;

  return {
    voiceWarningDismissed:
      typeof saved.voiceWarningDismissed === 'boolean'
        ? saved.voiceWarningDismissed
        : DEFAULTS.voiceWarningDismissed,
    locale: asLocale(saved.locale),
    themeMode: asThemeMode(saved.themeMode),
  };
};

/** Grava um subconjunto das preferências, preservando o resto. */
export const updateSettings = async (patch: Partial<AppSettings>): Promise<AppSettings> => {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await saveData(STORAGE_KEYS.SETTINGS, next);
  return next;
};
