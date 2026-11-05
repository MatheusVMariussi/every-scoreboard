import { ms } from '../../theme/responsive';

/**
 * Medidas compartilhadas pelas três partes do placar (nomes, histórico e painel da
 * rodada). As linhas só alinham se as três usarem os mesmos números.
 */
export const TABLE = {
  headerHeight: ms(30),
  rowHeight: ms(60),
  rowGap: ms(4),
  historyColumnWidth: ms(40),
  historyCellWidth: ms(34),
  panelWidth: ms(165),
  panelGap: ms(12),
  /**
   * A borda do painel empurra o conteúdo dele para baixo. Nomes e histórico ganham o
   * mesmo recuo no topo para as linhas das três partes continuarem alinhadas.
   */
  panelBorderWidth: 1,
} as const;
