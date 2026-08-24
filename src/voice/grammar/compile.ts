/**
 * Compila uma `Grammar` escrita em texto natural para índices normalizados.
 *
 * Roda uma vez por gramática, no carregamento do módulo. Garante que a gramática e o
 * transcript passem exatamente pelo mesmo `normalizeToken` — se cada lado normalizasse
 * de um jeito, "três" nunca acharia "tres".
 */

import { normalizePhrase, normalizeToken } from '../normalize';
import type { VoiceAction, VoiceLocale } from '../types';
import type { CompiledGrammar, Grammar } from './types';

const toNormalizedSet = (words: readonly string[], locale: VoiceLocale): ReadonlySet<string> =>
  new Set(words.map((word) => normalizeToken(word, locale)).filter((word) => word.length > 0));

/** Quebra uma expressão em sequência de tokens normalizados. */
const toSequence = (phrase: string, locale: VoiceLocale): string[] =>
  normalizePhrase(phrase, locale)
    .split(' ')
    .filter((token) => token.length > 0);

/** Mais longas primeiro: "próxima rodada" precisa ganhar de "próxima". */
const byLengthDesc = (a: { length: number }, b: { length: number }) => b.length - a.length;

export const compileGrammar = (grammar: Grammar): CompiledGrammar => {
  const { locale } = grammar;
  const actionByVerb = new Map<string, VoiceAction>();
  // Ordem de inserção define o desempate: a primeira ação que reivindica um verbo fica
  // com ele. Só importa para verbos ambíguos, que evitamos na gramática.
  (Object.keys(grammar.actions) as VoiceAction[]).forEach((action) => {
    grammar.actions[action].forEach((verb) => {
      const normalized = normalizeToken(verb, locale);
      if (normalized.length > 0 && !actionByVerb.has(normalized)) {
        actionByVerb.set(normalized, action);
      }
    });
  });

  const numbers = new Map<string, number>();
  Object.entries(grammar.numbers).forEach(([word, value]) => {
    const normalized = normalizeToken(word, locale);
    if (normalized.length > 0) numbers.set(normalized, value);
  });

  return {
    locale,
    actionByVerb,
    valueVerbs: toNormalizedSet(grammar.valueVerbs, locale),
    advance: grammar.advance
      .map((phrase) => toSequence(phrase, locale))
      .filter((sequence) => sequence.length > 0)
      .sort(byLengthDesc),
    undo: grammar.undo
      .map((phrase) => toSequence(phrase, locale))
      .filter((sequence) => sequence.length > 0)
      .sort(byLengthDesc),
    numbers,
    connectives: toNormalizedSet(grammar.connectives, locale),
    fillers: toNormalizedSet(grammar.fillers, locale),
    positional: toNormalizedSet(grammar.positional, locale),
    quantifierAll: toNormalizedSet(grammar.quantifiers.all, locale),
    quantifierRest: toNormalizedSet(grammar.quantifiers.rest, locale),
    phraseRewrites: grammar.phraseRewrites
      .map(([phrase, replacement]) => [toSequence(phrase, locale), replacement] as const)
      .filter(([sequence]) => sequence.length > 0)
      .sort((a, b) => b[0].length - a[0].length),
  };
};

/** Converte uma palavra numérica ou um dígito falado ("2") em número. */
export const numberFromToken = (
  normalizedToken: string,
  grammar: CompiledGrammar,
): number | null => {
  const fromWord = grammar.numbers.get(normalizedToken);
  if (fromWord !== undefined) return fromWord;
  if (/^\d+$/u.test(normalizedToken)) return Number.parseInt(normalizedToken, 10);
  return null;
};
