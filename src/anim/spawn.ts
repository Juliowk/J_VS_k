import gsap from 'gsap';
import type { Chip } from '../types';
import { $ } from '../ui/dom';
import { D, EASE } from './easings';

/**
 * Sai o palco versus, entra o HUD, e as fichas brotam do centro do tabuleiro.
 * Só transforms: cada face parte de um deslocamento até o centro, já convertido
 * para o referencial girado da ficha.
 */
export function spawnTl(chips: Chip[]) {
  const r = $('#board').getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const offsets = chips.map((c) => {
    const dx = cx - (r.left + (r.width * c.x) / 100);
    const dy = cy - (r.top + (r.height * c.y) / 100);
    const a = (-c.rot * Math.PI) / 180;
    return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
  });
  const faces = chips.map((c) => c.face);

  return gsap
    .timeline()
    .to(['.hero', '.vs'], { scale: 0.85, autoAlpha: 0, duration: D(0.4), ease: 'power2.in', stagger: 0.05 })
    .set('#game', { autoAlpha: 1 })
    .from('.hud', { yPercent: -100, opacity: 0, duration: D(0.5), ease: EASE.out })
    .from('.footbar', { yPercent: 100, opacity: 0, duration: D(0.5), ease: EASE.out }, '<')
    .from(
      faces,
      {
        x: (i) => offsets[i].x,
        y: (i) => offsets[i].y,
        rotation: (i) => -chips[i].rot,
        scale: 0,
        opacity: 0,
        duration: D(0.7),
        ease: EASE.bounce,
        stagger: { amount: 0.75, from: 'random' },
      },
      '-=0.35',
    )
    .set(faces, { clearProps: 'transform,opacity' })
    .set(['.hud', '.footbar'], { clearProps: 'transform,opacity' });
}
