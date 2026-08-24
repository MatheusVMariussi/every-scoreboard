/**
 * Registro de gramáticas, uma por idioma.
 *
 * A compilação roda uma vez por gramática, na primeira vez que o idioma é pedido, e o
 * resultado fica em cache — trocar de idioma no meio da sessão não recompila nada duas
 * vezes, e o custo de um idioma que ninguém usa é zero.
 */

import type { VoiceLocale } from '../types';
import { compileGrammar } from './compile';
import { enUS } from './en-US';
import { ptBR } from './pt-BR';
import type { CompiledGrammar, Grammar } from './types';

const SOURCES: Readonly<Record<VoiceLocale, Grammar>> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

const cache = new Map<VoiceLocale, CompiledGrammar>();

export const getGrammar = (locale: VoiceLocale): CompiledGrammar => {
  const cached = cache.get(locale);
  if (cached !== undefined) return cached;

  const compiled = compileGrammar(SOURCES[locale]);
  cache.set(locale, compiled);
  return compiled;
};
