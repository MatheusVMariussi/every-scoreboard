export type GameType = 'TRUCO' | 'CACHETA' | 'CANASTRA';

export interface Game {
  id: string;
  name: string;
  type: GameType;
  icon?: string; // Futuramente para ícones
}