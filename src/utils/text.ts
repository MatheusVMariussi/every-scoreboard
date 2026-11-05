/**
 * Uma palavra por linha. Para rótulos de botão em fonte larga: deixar o `Text` quebrar
 * sozinho corta a palavra no meio ("PLAC/AR") quando o botão é estreito.
 */
export const oneWordPerLine = (label: string): string => label.trim().split(/\s+/).join('\n');
