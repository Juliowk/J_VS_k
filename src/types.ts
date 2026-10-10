export type PlayerId = 'julio' | 'karen';

export interface Player {
  id: PlayerId;
  name: string;
  avatar: string;
  accent: string;
  font: string;
}

export interface Chip {
  n: number;          // 1..50
  x: number;          // % da largura do tabuleiro
  y: number;          // % da altura
  rot: number;        // graus
  markedBy?: PlayerId;
  el: HTMLButtonElement;
  face: HTMLSpanElement;
}

export interface Round {
  index: number;
  chooser: PlayerId;  // quem escolheu
  seeker: PlayerId;   // quem procurou
  target: number;
  timeMs?: number;
  misses: number;
}

export type Phase =
  | 'MENU' | 'INTRO' | 'SORTEIO' | 'SPAWN'
  | 'DESAFIO' | 'REVELACAO' | 'BUSCA' | 'ACERTO'
  | 'TROCA' | 'FIM';

export interface PlayerStats {
  total: number;
  count: number;
  avg: number;
  best?: { ms: number; n: number };
}

export interface MatchResult {
  winner: PlayerId | null;   // null = empate
  byAverage: boolean;        // número de buscas desigual: compara pelo tempo médio
  comparable: boolean;       // falso se algum jogador não completou nenhuma busca
  stats: Record<PlayerId, PlayerStats>;
}
