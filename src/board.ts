import type { Chip } from './types';
import { h } from './ui/dom';
import { ICON } from './ui/icons';

export const COLS = 10;
export const ROWS = 5;

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Grade 10×5 com variação aleatória dentro de cada célula.
 * `jx`/`jy` são o deslocamento máximo em fração da célula (0,25 = ±25%).
 */
export function layout(jx = 0.25, jy = 0.25): Omit<Chip, 'el' | 'face'>[] {
  const nums = shuffle(Array.from({ length: COLS * ROWS }, (_, i) => i + 1));
  const jitter = (amp: number) => (Math.random() - 0.5) * 2 * amp;
  return nums.map((n, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    return {
      n,
      x: ((c + 0.5 + jitter(jx)) / COLS) * 100,
      y: ((r + 0.5 + jitter(jy)) / ROWS) * 100,
      rot: (Math.random() - 0.5) * 28,
    };
  });
}

/**
 * Limita o deslocamento para que duas fichas vizinhas nunca se encostem,
 * mesmo giradas (até 14°).
 */
function jitterLimits(board: HTMLElement) {
  const probe = h('div', { style: { position: 'absolute', width: 'var(--chip)', visibility: 'hidden' } });
  board.append(probe);
  const chip = probe.offsetWidth;
  probe.remove();
  const footprint = chip * 1.22;   // diagonal de um quadrado girado 14°
  const rect = board.getBoundingClientRect();
  const cellW = rect.width / COLS, cellH = rect.height / ROWS;
  const lim = (cell: number) => Math.min(0.25, Math.max(0, (cell - footprint) / 2 / cell));
  return { jx: lim(cellW), jy: lim(cellH) };
}

export function buildBoard(board: HTMLElement): Chip[] {
  board.replaceChildren();
  const { jx, jy } = jitterLimits(board);
  return layout(jx, jy).map((c) => {
    const face = h('span', { class: 'chip-face', html: `<span class="chip-n">${c.n}</span>${ICON.mark}` });
    const el = h(
      'button',
      {
        class: 'chip',
        attrs: { type: 'button', 'data-n': String(c.n), 'aria-label': `Número ${c.n}` },
        style: { left: `${c.x}%`, top: `${c.y}%`, '--rot': `${c.rot.toFixed(1)}deg` },
      },
      face,
    );
    board.append(el);
    return { ...c, el, face };
  });
}
