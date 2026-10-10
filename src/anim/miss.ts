import gsap from 'gsap';
import { COLORS } from '../players';
import { sfx } from '../sfx';
import type { Chip } from '../types';
import { center, h, $ } from '../ui/dom';
import { hudEls } from '../ui/hud';
import { D, reduced } from './easings';

export function missTl(chip: Chip, penaltyMs: number) {
  const face = chip.face;
  sfx.miss();
  gsap.killTweensOf(face);
  gsap.set(face, { x: 0 });

  const tl = gsap.timeline();
  if (!reduced) tl.to(face, { x: '+=8', duration: 0.05, repeat: 5, yoyo: true, ease: 'power1.inOut' });
  tl.to(face, { backgroundColor: COLORS.error, duration: 0.05 }, 0)
    .to(face, { backgroundColor: COLORS.bone, duration: 0.25, clearProps: 'backgroundColor' });

  if (penaltyMs > 0) {
    const c = center(hudEls.timer);
    const tag = h('div', { class: 'fly fly-penalty', text: `+${(penaltyMs / 1000).toLocaleString('pt-BR')}s` });
    $('#fx').append(tag);
    gsap.set(tag, { x: c.x + c.w / 2 + 8, y: c.y + c.h / 2 });
    tl.fromTo(
      tag,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, y: '-=24', duration: D(0.25), ease: 'back.out(2)' },
      0,
    ).to(tag, { opacity: 0, y: '-=16', duration: D(0.35), onComplete: () => tag.remove() }, '+=0.25');
  }
  return tl;
}
