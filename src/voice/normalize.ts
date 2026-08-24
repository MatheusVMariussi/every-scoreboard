/**
 * Normalização de texto, por idioma.
 *
 * O reconhecedor devolve nomes próprios que ele nunca viu, transcritos "de ouvido".
 * "Tião" volta como tiao/thiago/ti ao, "Chris" volta como kris/cris. Antes de comparar
 * qualquer coisa, dobramos os grafemas que o idioma troca com frequência, para que
 * variações de escrita virem a mesma string.
 *
 * A mesma função roda no transcript, na gramática e nos nomes do placar — se as pontas
 * não passarem pelo mesmo pipeline, a comparação não vale nada. Por isso o idioma é
 * parâmetro obrigatório: normalizar pt-BR de um lado e en-US do outro é um bug silencioso.
 */

import type { VoiceLocale } from './types';

/**
 * Marcas combinantes deixadas pela decomposição NFD.
 * Construído a partir de string para não deixar caractere invisível no fonte.
 */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'gu');

/** Remove acentos via decomposição NFD (ã -> a, ç -> c). */
export const stripDiacritics = (input: string): string =>
  input.normalize('NFD').replace(COMBINING_MARKS, '');

interface LocaleRules {
  /**
   * Dobras de grafema, aplicadas em ordem. Dígrafos antes das letras soltas, senão a
   * regra da letra come o dígrafo antes de ele ser reconhecido.
   */
  folds: readonly (readonly [RegExp, string])[];
}

/**
 * pt-BR: o português escreve o mesmo som de várias formas (ph/f, ch/x, qu/k), e o "h"
 * inicial é mudo.
 */
const PT_BR_RULES: LocaleRules = {
  folds: [
    // "h" inicial é mudo: Henrique -> enrique.
    [/^h/u, ''],
    [/ph/gu, 'f'],
    [/th/gu, 't'],
    [/lh/gu, 'l'],
    [/nh/gu, 'n'],
    [/ch/gu, 'x'],
    [/qu/gu, 'k'],
    [/ss/gu, 's'],
    [/rr/gu, 'r'],
    [/y/gu, 'i'],
    [/w/gu, 'v'],
  ],
};

/**
 * en-US: as dobras miram os pares de nomes homófonos que o reconhecedor escolhe por
 * conta própria — Chris/Kris, Cathy/Kathy, Mark/Marc, Eric/Erik, Sara/Sarah,
 * Megan/Meghan, Jon/John, Zach/Zack, Nicole/Nichole.
 *
 * Duas diferenças de propósito em relação ao pt-BR: o "h" inicial **não** cai (Harry e
 * Arry são nomes diferentes em inglês), e "w" não vira "v" (são sons distintos).
 */
const EN_US_RULES: LocaleRules = {
  folds: [
    // Dígrafos primeiro; cada um consome o próprio "h".
    [/ph/gu, 'f'],
    [/ch/gu, 'k'],
    [/sh/gu, 's'],
    [/wh/gu, 'w'],
    [/ck/gu, 'k'],
    [/qu/gu, 'kw'],
    // "c" é mole antes de e/i/y e duro no resto: Cecil -> sesil, Cathy -> kathi (= Kathy).
    [/c(?=[eiy])/gu, 's'],
    [/c/gu, 'k'],
    // Sobrou "h" depois de outra letra? É mudo: John -> jon, Meghan -> megan, Sarah -> sara.
    // "th" fica de fora de propósito, e não por fonética: sem essa exceção "then" viraria
    // "ten" (o número 10) e "Beth" viraria "bet" (o verbo). Escrito sem lookbehind porque
    // o Hermes não suporta.
    [/([^t])h/gu, '$1'],
    [/y/gu, 'i'],
  ],
};

const RULES: Readonly<Record<VoiceLocale, LocaleRules>> = {
  'pt-BR': PT_BR_RULES,
  'en-US': EN_US_RULES,
};

/**
 * Normaliza uma única palavra. Devolve string vazia se não sobrar nada aproveitável
 * (pontuação solta, por exemplo).
 */
export const normalizeToken = (raw: string, locale: VoiceLocale): string => {
  let out = stripDiacritics(raw.toLowerCase()).replace(/[^a-z0-9]/gu, '');
  if (out.length === 0) return '';

  for (const [pattern, replacement] of RULES[locale].folds) {
    out = out.replace(pattern, replacement);
    if (out.length === 0) return '';
  }

  // "z" final soa como "s" nos dois idiomas: Luiz -> luis, Liz -> lis.
  out = out.replace(/z$/u, 's');

  // Letras repetidas não mudam o som: Anna -> ana, Jeff -> jef.
  out = out.replace(/(.)\1+/gu, '$1');

  return out;
};

/** Quebra a fala em palavras cruas, preservando a ordem e descartando pontuação. */
export const tokenize = (transcript: string): string[] =>
  transcript
    .split(/[\s,;:.!?]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

/**
 * Normaliza uma frase inteira, mantendo as palavras separadas por um espaço.
 * Usado para casar expressões de várias palavras ("próxima rodada", "next round").
 */
export const normalizePhrase = (raw: string, locale: VoiceLocale): string =>
  tokenize(raw)
    .map((token) => normalizeToken(token, locale))
    .filter((token) => token.length > 0)
    .join(' ');

/** Junta palavras cruas em uma única chave normalizada ("Ana Paula" -> "anapaula"). */
export const normalizeJoined = (rawTokens: string[], locale: VoiceLocale): string =>
  rawTokens.map((token) => normalizeToken(token, locale)).join('');
