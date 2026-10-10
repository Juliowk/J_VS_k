import type { Chip } from './types';
import { h } from './ui/dom';
import { ICON } from './ui/icons';

export type Spot = Pick<Chip, 'x' | 'y' | 'rot'>;

/** Folga entre centros, em lados de ficha: uma ficha girada ocupa até √2 ≈ 1,41. */
const GAP = 1.45;
/** Fração da área que os discos de exclusão ocupam: abaixo do limite (~0,55) da amostragem aleatória. */
const FILL = 0.42;

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lado da ficha (px) para `n` fichas espalhadas num tabuleiro W×H. */
function chipSize(w: number, hgt: number, n: number) {
  const d = Math.sqrt((FILL * 4 * w * hgt) / (Math.PI * n));
  return Math.min(d / GAP, 92);
}

/**
 * Amostragem por dardos: posições aleatórias sem sobreposição, em qualquer giro
 * (inclusive de cabeça para baixo). Se não couber, encolhe a ficha e recomeça.
 */
function scatter(w: number, hgt: number, n: number, chip: number): { spots: Spot[]; chip: number } {
  for (;;) {
    const d = chip * GAP, r = (chip * Math.SQRT2) / 2, d2 = d * d;
    const pts: { x: number; y: number }[] = [];
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      ok = false;
      for (let t = 0; t < 80; t++) {
        const x = r + Math.random() * (w - 2 * r), y = r + Math.random() * (hgt - 2 * r);
        if (pts.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 >= d2)) {
          pts.push({ x, y });
          ok = true;
          break;
        }
      }
    }
    if (ok) {
      const spots = pts.map((p) => ({ x: (p.x / w) * 100, y: (p.y / hgt) * 100, rot: Math.random() * 360 - 180 }));
      return { spots, chip };
    }
    chip *= 0.95;
  }
}

/** O número lido de cabeça para baixo, ou null se algum dígito não vira dígito. */
function rotated180(n: number) {
  const map: Record<string, string> = { 0: '0', 1: '1', 6: '9', 8: '8', 9: '6' };
  const s = [...String(n)].reverse().map((c) => map[c]);
  if (s.some((c) => c === undefined) || s[0] === '0') return null;
  return Number(s.join(''));
}

/** 6/9, 18/81, 66/99…: girado, vira outro número do jogo. Recebe sublinhado. */
const isAmbiguous = (n: number, total: number) => {
  const m = rotated180(n);
  return m !== null && m !== n && m <= total;
};

function measure(board: HTMLElement) {
  const { width, height } = board.getBoundingClientRect();
  return { w: width, hgt: height };
}

let base = { w: 0, hgt: 0, chip: 0 };

/**
 * Novas posições para as fichas já existentes. Parte sempre do tamanho ideal
 * (senão o encolhimento do scatter se acumularia a cada turno).
 */
export function reshuffle(board: HTMLElement, chips: Chip[]): Spot[] {
  const { w, hgt } = measure(board);
  const { spots, chip } = scatter(w, hgt, chips.length, chipSize(w, hgt, chips.length));
  setTile(board, chip, w, hgt);
  return spots;
}

function setTile(board: HTMLElement, chip: number, w: number, hgt: number) {
  base = { w, hgt, chip };
  board.style.setProperty('--tile', `${chip.toFixed(1)}px`);
}

/** Acompanha o redimensionamento da janela: as posições são em %, só o tamanho muda. */
export function fitBoard(board: HTMLElement) {
  if (!base.w) return;
  const { w, hgt } = measure(board);
  if (!w || !hgt) return;
  const chip = base.chip * Math.min(w / base.w, hgt / base.hgt);
  board.style.setProperty('--tile', `${chip.toFixed(1)}px`);
}

export function buildBoard(board: HTMLElement, total: number): Chip[] {
  board.replaceChildren();
  const { w, hgt } = measure(board);
  const { spots, chip } = scatter(w, hgt, total, chipSize(w, hgt, total));
  setTile(board, chip, w, hgt);
  const nums = shuffle(Array.from({ length: total }, (_, i) => i + 1));
  return spots.map((s, i) => {
    const n = nums[i];
    const face = h('span', { class: 'chip-face', html: `<span class="chip-n">${n}</span>${ICON.mark}` });
    const el = h(
      'button',
      {
        class: isAmbiguous(n, total) ? 'chip is-ambiguous' : 'chip',
        attrs: { type: 'button', 'data-n': String(n), 'aria-label': `Número ${n}` },
        style: { left: `${s.x}%`, top: `${s.y}%`, '--rot': `${s.rot.toFixed(1)}deg` },
      },
      face,
    );
    board.append(el);
    return { n, ...s, el, face };
  });
}
