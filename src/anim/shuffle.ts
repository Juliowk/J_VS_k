import gsap from 'gsap';
import type { Spot } from '../board';
import { sfx } from '../sfx';
import type { Chip } from '../types';
import { $ } from '../ui/dom';
import { D, EASE } from './easings';

/**
 * Embaralha o tabuleiro entre turnos: as faces encolhem, os botões voam girando
 * até as novas posições (left/top/--rot) e as faces voltam com um quique.
 */
export function shuffleTl(chips: Chip[], next: Spot[]) {
  const board = $('#board');
  const els = chips.map((c) => c.el);
  const faces = chips.map((c) => c.face);

  return gsap
    .timeline({
      onStart: () => {
        board.classList.add('is-shuffling');
        sfx.shuffle();
      },
      onComplete: () => {
        chips.forEach((c, i) => Object.assign(c, next[i]));
        board.classList.remove('is-shuffling');
      },
    })
    .to(faces, { scale: 0.7, duration: D(0.18), ease: 'power2.in' })
    .to(
      els,
      {
        left: (i) => `${next[i].x}%`,
        top: (i) => `${next[i].y}%`,
        '--rot': (i: number) => `${next[i].rot.toFixed(1)}deg`,
        duration: D(0.8),
        ease: 'power3.inOut',
        stagger: { amount: D(0.35), from: 'random' },
      },
      '<0.08',
    )
    .to(faces, { scale: 1, duration: D(0.35), ease: EASE.bounce, stagger: { amount: D(0.2), from: 'random' } }, '-=0.3')
    .set(faces, { clearProps: 'transform' });
}
