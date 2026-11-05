/**
 * Leitura defensiva do que vem do disco. Os saves foram gravados por esta ou por uma
 * versão anterior do app, e um campo ausente ou estranho não pode chegar ao render e
 * derrubar a tela: cada leitor cai no padrão em vez de confiar.
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const intInRange = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;

export const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;

/** Texto em branco conta como ausente: a tela mostraria um nome vazio. */
export const nonBlankString = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() !== '' ? value : fallback;
