/**
 * Transforma uma transcrição em comandos de placar.
 *
 * O português falado numa mesa de carteado é quase sempre Sujeito-Verbo ("léo e ana
 * correram"), mas não sempre: "ganhou o zé" é igualmente natural. O parser aceita as
 * duas ordens, e cada nome é resolvido de forma independente — um nome ruim numa lista
 * de quatro não derruba os outros três.
 *
 * Nada aqui é específico de um idioma: verbos, números e muletas vêm da `Grammar` do
 * `context.locale`, e a normalização segue o mesmo idioma de ponta a ponta.
 *
 * O pipeline é: reescrever expressões compostas -> extrair comandos de controle ->
 * separar em orações por verbo -> resolver nomes.
 *
 * Nada aqui altera o placar. A saída é sempre uma proposta para o usuário aprovar.
 */

import { getGrammar } from './grammar';
import { numberFromToken } from './grammar/compile';
import type { CompiledGrammar } from './grammar/types';
import { ACCEPT_SCORE, buildRoster, matchByPosition, matchPlayer } from './matchPlayer';
import type { MatchResult } from './matchPlayer';
import { normalizeJoined, normalizeToken, tokenize } from './normalize';
import type {
  ParseContext,
  RosterEntry,
  UnresolvedIntent,
  VoiceAction,
  VoiceCommand,
} from './types';

/** Quantas palavras depois do verbo ainda procuramos por um número. */
const VALUE_LOOKAHEAD = 2;

type Resolution =
  | { status: 'resolved'; playerId: string; confidence: number }
  | { status: 'unresolved'; token: string; candidates: string[] };

interface Roster {
  entries: RosterEntry[];
  aliases: Record<string, string>;
}

/** Fala já limpa: tokens crus, seus normalizados, e os sinais de controle extraídos. */
interface Prepared {
  raw: string[];
  normalized: string[];
  advance: boolean;
  undo: boolean;
}

const toResolution = (match: MatchResult, rawToken: string): Resolution => {
  if (match.status === 'resolved') {
    return { status: 'resolved', playerId: match.playerId, confidence: match.score };
  }
  const candidates = match.status === 'ambiguous' ? match.candidates : [];
  return { status: 'unresolved', token: rawToken, candidates };
};

/** Palavra sem semântica própria: artigo, muleta, ou ligação entre nomes. */
const isStructural = (normalized: string, grammar: CompiledGrammar): boolean =>
  normalized.length === 0 || grammar.fillers.has(normalized) || grammar.connectives.has(normalized);

/** Casa uma sequência de tokens normalizados a partir de `start`. */
const matchesAt = (normalized: string[], start: number, sequence: readonly string[]): boolean => {
  if (start + sequence.length > normalized.length) return false;
  return sequence.every((token, offset) => normalized[start + offset] === token);
};

// --- Pré-processamento ---

/**
 * Reduz expressões compostas a um único token canônico ("pulou fora" -> "correu").
 *
 * Precisa vir antes de tudo: além de dar suporte a verbos de várias palavras, evita que
 * a palavra de apoio sobre procurando dono — sem isto "ganhou a rodada" deixaria
 * "rodada" solta tentando virar um jogador.
 */
const rewritePhrases = (raw: string[], normalized: string[], grammar: CompiledGrammar) => {
  const outRaw: string[] = [];
  const outNormalized: string[] = [];
  let index = 0;

  while (index < raw.length) {
    const hit = grammar.phraseRewrites.find(([sequence]) => matchesAt(normalized, index, sequence));
    if (hit !== undefined) {
      outRaw.push(hit[1]);
      outNormalized.push(normalizeToken(hit[1], grammar.locale));
      index += hit[0].length;
      continue;
    }
    outRaw.push(raw[index]);
    outNormalized.push(normalized[index]);
    index += 1;
  }

  return { raw: outRaw, normalized: outNormalized };
};

/**
 * Retira "próxima rodada" / "desfazer" de qualquer posição da fala.
 *
 * Antes isto só casava contra a frase inteira, então "léo ganhou, próxima rodada" não
 * disparava nada — que era exatamente a reclamação de falar várias coisas de uma vez.
 */
const extractControl = (
  raw: string[],
  normalized: string[],
  grammar: CompiledGrammar,
): Prepared => {
  const outRaw: string[] = [];
  const outNormalized: string[] = [];
  let advance = false;
  let undo = false;
  let index = 0;

  while (index < raw.length) {
    const advanceHit = grammar.advance.find((sequence) => matchesAt(normalized, index, sequence));
    if (advanceHit !== undefined) {
      advance = true;
      index += advanceHit.length;
      continue;
    }
    const undoHit = grammar.undo.find((sequence) => matchesAt(normalized, index, sequence));
    if (undoHit !== undefined) {
      undo = true;
      index += undoHit.length;
      continue;
    }
    outRaw.push(raw[index]);
    outNormalized.push(normalized[index]);
    index += 1;
  }

  return { raw: outRaw, normalized: outNormalized, advance, undo };
};

const prepare = (transcript: string, grammar: CompiledGrammar): Prepared => {
  const tokens = tokenize(transcript);
  const normalized = tokens.map((token) => normalizeToken(token, grammar.locale));

  // Descarta o que virou vazio na normalização (pontuação solta).
  const kept = normalized
    .map((token, index) => (token.length > 0 ? index : -1))
    .filter((index) => index >= 0);

  const rewritten = rewritePhrases(
    kept.map((index) => tokens[index]),
    kept.map((index) => normalized[index]),
    grammar,
  );

  return extractControl(rewritten.raw, rewritten.normalized, grammar);
};

// --- Resolução de nomes ---

/** "jogador um" / "jogador 2" — também é o caminho natural quando ninguém renomeou. */
const tryPositional = (
  raw: string,
  nextRaw: string,
  roster: Roster,
  grammar: CompiledGrammar,
): Resolution | null => {
  if (!grammar.positional.has(normalizeToken(raw, grammar.locale))) return null;
  const position = numberFromToken(normalizeToken(nextRaw, grammar.locale), grammar);
  if (position === null) return null;
  return toResolution(matchByPosition(position, roster.entries), `${raw} ${nextRaw}`);
};

/** Nome composto ("ana paula"), aceito só quando casa melhor que a palavra sozinha. */
const tryCompoundName = (
  raw: string,
  nextRaw: string,
  roster: Roster,
  grammar: CompiledGrammar,
): Resolution | null => {
  if (isStructural(normalizeToken(nextRaw, grammar.locale), grammar)) return null;

  const joined = matchPlayer(
    normalizeJoined([raw, nextRaw], grammar.locale),
    roster.entries,
    roster.aliases,
  );
  if (joined.status !== 'resolved' || joined.score < ACCEPT_SCORE) return null;

  const alone = matchPlayer(normalizeToken(raw, grammar.locale), roster.entries, roster.aliases);
  const aloneScore = alone.status === 'resolved' ? alone.score : 0;
  // `>=` e não `>`: com "Ana" e "Ana Paula" no placar ambos dão 1.0, e o nome composto
  // precisa ganhar — senão "paula" sobraria solta como não reconhecida.
  if (joined.score < aloneScore) return null;

  return toResolution(joined, `${raw} ${nextRaw}`);
};

/** "todos" / "o resto" — expande para vários jogadores de uma vez. */
const tryQuantifier = (
  normalized: string,
  roster: Roster,
  grammar: CompiledGrammar,
  mentioned: ReadonlySet<string>,
): Resolution[] | null => {
  const expand = (entries: RosterEntry[]): Resolution[] =>
    entries.map((entry) => ({ status: 'resolved', playerId: entry.id, confidence: 1 }));

  if (grammar.quantifierAll.has(normalized)) return expand(roster.entries);
  if (grammar.quantifierRest.has(normalized)) {
    return expand(roster.entries.filter((entry) => !mentioned.has(entry.id)));
  }
  return null;
};

/**
 * Converte o buffer de palavras acumuladas em jogadores.
 *
 * `mentioned` é só de leitura aqui — quem decide registrar é `parseClauses`, porque uma
 * oração descartada não pode contar como "já citado".
 * Palavras não resolvidas viram `unresolved` em vez de sumirem em silêncio.
 */
const resolveNames = (
  buffer: string[],
  roster: Roster,
  grammar: CompiledGrammar,
  mentioned: ReadonlySet<string>,
): Resolution[] => {
  const resolutions: Resolution[] = [];
  let index = 0;

  while (index < buffer.length) {
    const raw = buffer[index];
    const normalized = normalizeToken(raw, grammar.locale);

    if (isStructural(normalized, grammar)) {
      index += 1;
      continue;
    }

    const quantified = tryQuantifier(normalized, roster, grammar, mentioned);
    if (quantified !== null) {
      resolutions.push(...quantified);
      index += 1;
      continue;
    }

    const nextRaw: string | undefined = buffer[index + 1];
    const pair =
      nextRaw === undefined
        ? null
        : (tryPositional(raw, nextRaw, roster, grammar) ??
          tryCompoundName(raw, nextRaw, roster, grammar));

    if (pair !== null) {
      resolutions.push(pair);
      index += 2;
      continue;
    }

    resolutions.push(toResolution(matchPlayer(normalized, roster.entries, roster.aliases), raw));
    index += 1;
  }

  return resolutions;
};

const emit = (resolutions: Resolution[], intent: UnresolvedIntent): VoiceCommand[] =>
  resolutions.map((resolution) => {
    if (resolution.status === 'unresolved') {
      return {
        kind: 'unresolved' as const,
        token: resolution.token,
        candidates: resolution.candidates,
        intent,
      };
    }
    return intent.game === 'cacheta'
      ? {
          kind: 'cacheta.action' as const,
          playerId: resolution.playerId,
          action: intent.action,
          confidence: resolution.confidence,
        }
      : {
          kind: 'fodinha.value' as const,
          playerId: resolution.playerId,
          amount: intent.amount,
          mode: intent.mode,
          confidence: resolution.confidence,
        };
  });

// --- Orações ---

/**
 * Percorre a fala acumulando nomes até encontrar um verbo.
 *
 * `pendingIntent` é o que permite a ordem invertida: um verbo que chega sem nenhum nome
 * acumulado fica esperando os nomes que vêm depois ("ganhou o zé").
 */
const parseClauses = (
  prepared: Prepared,
  roster: Roster,
  grammar: CompiledGrammar,
  intentAt: (index: number) => { intent: UnresolvedIntent; consumed: number } | null,
): VoiceCommand[] => {
  const commands: VoiceCommand[] = [];
  const mentioned = new Set<string>();
  let buffer: string[] = [];
  let pendingIntent: UnresolvedIntent | null = null;

  const flush = (intent: UnresolvedIntent, fromPendingVerb: boolean) => {
    const resolutions = resolveNames(buffer, roster, grammar, mentioned);
    buffer = [];

    // Um verbo dito ANTES dos nomes só vira comando se algum nome de fato resolveu.
    // Sem esta trava, conversa de mesa que comece por um verbo — "passa a cerveja" —
    // capturaria as palavras seguintes e viraria um pendente do nada.
    if (fromPendingVerb && !resolutions.some((item) => item.status === 'resolved')) return;

    resolutions.forEach((resolution) => {
      if (resolution.status === 'resolved') mentioned.add(resolution.playerId);
    });
    commands.push(...emit(resolutions, intent));
  };

  for (let index = 0; index < prepared.raw.length; index += 1) {
    const found = intentAt(index);
    if (found === null) {
      buffer.push(prepared.raw[index]);
      continue;
    }

    if (buffer.length > 0) {
      // Um verbo pendente reivindica os nomes que vieram depois dele, não os de agora.
      flush(pendingIntent ?? found.intent, pendingIntent !== null);
      pendingIntent = pendingIntent === null ? null : found.intent;
    } else {
      pendingIntent = found.intent;
    }

    index += found.consumed;
  }

  if (pendingIntent !== null && buffer.length > 0) flush(pendingIntent, true);

  return commands;
};

/**
 * Procura o número que acompanha um verbo de Fodinha ("apostou **dois**").
 * Pula muletas no caminho, mas para em qualquer palavra com conteúdo.
 */
const findValueAfter = (
  normalized: string[],
  verbIndex: number,
  grammar: CompiledGrammar,
): { amount: number; consumed: number } | null => {
  const limit = Math.min(normalized.length - 1, verbIndex + VALUE_LOOKAHEAD);
  for (let index = verbIndex + 1; index <= limit; index += 1) {
    const amount = numberFromToken(normalized[index], grammar);
    if (amount !== null) return { amount, consumed: index - verbIndex };
    if (!grammar.fillers.has(normalized[index])) return null;
  }
  return null;
};

export const parseCommand = (transcript: string, context: ParseContext): VoiceCommand[] => {
  const grammar = getGrammar(context.locale);
  const prepared = prepare(transcript, grammar);

  const roster: Roster = {
    entries: buildRoster(context.players, context.locale),
    aliases: context.aliases ?? {},
  };

  const commands =
    context.game === 'cacheta'
      ? parseClauses(prepared, roster, grammar, (index) => {
          const action: VoiceAction | undefined = grammar.actionByVerb.get(
            prepared.normalized[index],
          );
          return action === undefined ? null : { intent: { game: 'cacheta', action }, consumed: 0 };
        })
      : parseClauses(prepared, roster, grammar, (index) => {
          // Trunca pelo tamanho da rodada para a fila mostrar o que de fato será
          // aplicado — aprovar "dez" e receber "três" seria uma mentira silenciosa.
          const clamp = (value: number) =>
            context.cardsInRound === undefined
              ? value
              : Math.max(0, Math.min(context.cardsInRound, value));

          if (grammar.valueVerbs.has(prepared.normalized[index])) {
            const found = findValueAfter(prepared.normalized, index, grammar);
            if (found !== null) {
              return {
                intent: { game: 'fodinha', amount: clamp(found.amount), mode: 'set' },
                consumed: found.consumed,
              };
            }
            // Verbo sem número na fase de resultado é o placar sendo cantado vaza a vaza:
            // "matheus fez" = mais uma. Na fase de apostas não diz nada, e é descartado.
            if (context.phase !== 'results') return null;
            return { intent: { game: 'fodinha', amount: 1, mode: 'add' }, consumed: 0 };
          }

          // Número solto fecha a oração sozinho: "matheus dois, joão um, noelle zero".
          // É como as apostas são anunciadas na prática, sem verbo nenhum.
          const bare = numberFromToken(prepared.normalized[index], grammar);
          if (bare === null) return null;

          // ...menos quando o número é o índice de uma referência posicional, senão
          // "jogador dois" viraria "aposta de dois" e deixaria "jogador" órfão.
          const previous = index > 0 ? prepared.normalized[index - 1] : '';
          if (grammar.positional.has(previous)) return null;

          return { intent: { game: 'fodinha', amount: clamp(bare), mode: 'set' }, consumed: 0 };
        });

  if (prepared.undo) commands.push({ kind: 'undo' });
  if (prepared.advance) commands.push({ kind: 'advance' });

  // Fala que sobrou vazia depois da normalização (só pontuação) não é "não entendi".
  if (commands.length === 0) {
    return prepared.raw.length === 0 ? [] : [{ kind: 'unparsed', raw: transcript.trim() }];
  }
  return commands;
};
