/**
 * Contrato da gramática de voz.
 *
 * Toda a parte dependente de idioma vive atrás desta interface. Adicionar um idioma
 * significa escrever outro objeto `Grammar` — o parser não muda.
 *
 * As listas são escritas em texto natural (com acento, como se fala). O compilador
 * em `compile.ts` passa tudo por `normalizeToken`, então não é preciso pré-normalizar
 * nada à mão aqui.
 */

import type { VoiceAction, VoiceLocale } from '../types';

export interface Grammar {
  /** Idioma desta gramática. Define também como os tokens são normalizados. */
  locale: VoiceLocale;
  /** Verbos de Cacheta, por ação resultante. */
  actions: Readonly<Record<VoiceAction, readonly string[]>>;
  /** Verbos de Fodinha que carregam um número ("apostou dois", "fez três"). */
  valueVerbs: readonly string[];
  /** Frases que disparam aplicar + avançar rodada. */
  advance: readonly string[];
  /** Frases que desfazem a última entrada pendente. */
  undo: readonly string[];
  /** Palavras numéricas -> valor. Inclui "meia" = 6. */
  numbers: Readonly<Record<string, number>>;
  /** Ligações entre nomes numa lista ("léo e ana"). */
  connectives: readonly string[];
  /** Palavras ignoradas ao procurar nomes (artigos, muletas de fala). */
  fillers: readonly string[];
  /** Palavras que indicam referência posicional ("jogador um"). */
  positional: readonly string[];
  /** Expressões que valem por vários jogadores de uma vez. */
  quantifiers: {
    /** "todos", "todo mundo" — a mesa inteira. */
    all: readonly string[];
    /** "o resto", "os outros" — quem ainda não foi citado nesta fala. */
    rest: readonly string[];
  };
  /**
   * Expressões de várias palavras reduzidas a um único token canônico, aplicadas antes
   * de qualquer outra coisa.
   *
   * Resolve dois problemas de uma vez: dá suporte a verbos compostos ("pulou fora"), e
   * evita que a palavra de apoio vire um nome não reconhecido — sem isto, "ganhou a
   * rodada" deixaria "rodada" solta procurando um jogador.
   */
  phraseRewrites: readonly (readonly [string, string])[];
}

/** Gramática pré-processada, com tudo normalizado e indexado para busca O(1). */
export interface CompiledGrammar {
  locale: VoiceLocale;
  actionByVerb: ReadonlyMap<string, VoiceAction>;
  valueVerbs: ReadonlySet<string>;
  /** Sequências de tokens, para casar mesmo no meio da fala. */
  advance: readonly (readonly string[])[];
  undo: readonly (readonly string[])[];
  numbers: ReadonlyMap<string, number>;
  connectives: ReadonlySet<string>;
  fillers: ReadonlySet<string>;
  positional: ReadonlySet<string>;
  quantifierAll: ReadonlySet<string>;
  quantifierRest: ReadonlySet<string>;
  /** Sequência normalizada -> token de substituição, mais longas primeiro. */
  phraseRewrites: readonly (readonly [readonly string[], string])[];
}
