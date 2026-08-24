/**
 * Resolução de nomes — o coração da funcionalidade de voz.
 *
 * O resto do parser é mecânico. Aqui é onde mora o erro: o reconhecedor devolve um
 * nome próprio que ele nunca viu, falado numa mesa barulhenta.
 *
 * Regra que não se quebra: **nunca chutar**. Um palpite errado é barato quando aparece
 * na fila para o usuário conferir; um palpite errado que *parece* confiante não é.
 * Por isso existem duas notas de corte e uma checagem de ambiguidade.
 */

import { normalizeToken } from './normalize';
import type { RosterEntry, RosterPlayer, VoiceLocale } from './types';

/** Acima disso, resolve direto. */
export const ACCEPT_SCORE = 0.86;
/** Entre este valor e `ACCEPT_SCORE`, entra na fila marcado como baixa confiança. */
export const REVIEW_SCORE = 0.7;
/** Se os dois melhores ficarem a menos disso um do outro, é ambíguo — não escolhe. */
export const AMBIGUITY_DELTA = 0.05;

export type MatchResult =
  | { status: 'resolved'; playerId: string; score: number; lowConfidence: boolean }
  | { status: 'ambiguous'; candidates: string[]; score: number }
  | { status: 'none' };

/**
 * Similaridade de Jaro entre duas strings.
 * Base do Jaro-Winkler; separada para poder ser testada isoladamente.
 */
export const jaro = (a: string, b: string): number => {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const window = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatched = new Array<boolean>(a.length).fill(false);
  const bMatched = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - window);
    const end = Math.min(i + window + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatched[j] || a[i] !== b[j]) continue;
      aMatched[i] = true;
      bMatched[j] = true;
      matches += 1;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatched[i]) continue;
    while (!bMatched[k]) k += 1;
    if (a[i] !== b[k]) transpositions += 1;
    k += 1;
  }

  const half = transpositions / 2;
  return (matches / a.length + matches / b.length + (matches - half) / matches) / 3;
};

/**
 * Jaro-Winkler: Jaro com bônus para prefixo comum.
 *
 * O peso no prefixo é o que serve aqui — são todos primeiros nomes curtos (o campo de
 * nome tem limite de 12 caracteres), e o reconhecedor costuma acertar o começo da
 * palavra e errar o fim.
 */
export const jaroWinkler = (a: string, b: string, prefixWeight = 0.1): number => {
  const base = jaro(a, b);
  if (base < 0.7) return base;

  const maxPrefix = Math.min(4, a.length, b.length);
  let prefix = 0;
  while (prefix < maxPrefix && a[prefix] === b[prefix]) prefix += 1;

  return base + prefix * prefixWeight * (1 - base);
};

/** Pré-calcula as formas normalizadas. Chamar quando o placar muda, não a cada token. */
export const buildRoster = (players: RosterPlayer[], locale: VoiceLocale): RosterEntry[] =>
  players.map((player, index) => ({
    ...player,
    normalized: normalizeToken(player.name.replace(/\s+/gu, ''), locale),
    position: index + 1,
  }));

/**
 * Resolve um token falado para um jogador.
 *
 * Ordem: apelido aprendido na sessão (exato) -> melhor nota difusa -> cortes.
 */
export const matchPlayer = (
  normalizedToken: string,
  roster: RosterEntry[],
  aliases: Record<string, string> = {},
): MatchResult => {
  if (normalizedToken.length === 0 || roster.length === 0) return { status: 'none' };

  // Apelido resolvido por toque antes: confiança total, sem passar pelo difuso.
  const aliasId = aliases[normalizedToken];
  if (aliasId !== undefined && roster.some((entry) => entry.id === aliasId)) {
    return { status: 'resolved', playerId: aliasId, score: 1, lowConfidence: false };
  }

  const scored = roster
    .map((entry) => ({ entry, score: jaroWinkler(normalizedToken, entry.normalized) }))
    .sort((left, right) => right.score - left.score);

  const best = scored[0];
  if (best.score < REVIEW_SCORE) return { status: 'none' };

  // Dois jogadores com nomes parecidos: recusa em vez de tirar cara ou coroa.
  const runnerUp = scored[1];
  if (runnerUp !== undefined && best.score - runnerUp.score < AMBIGUITY_DELTA) {
    return {
      status: 'ambiguous',
      candidates: [best.entry.id, runnerUp.entry.id],
      score: best.score,
    };
  }

  return {
    status: 'resolved',
    playerId: best.entry.id,
    score: best.score,
    lowConfidence: best.score < ACCEPT_SCORE,
  };
};

/** Resolve "jogador um" / "jogador 2" pela posição na mesa. */
export const matchByPosition = (position: number, roster: RosterEntry[]): MatchResult => {
  const entry = roster.find((candidate) => candidate.position === position);
  if (entry === undefined) return { status: 'none' };
  return { status: 'resolved', playerId: entry.id, score: 1, lowConfidence: false };
};
