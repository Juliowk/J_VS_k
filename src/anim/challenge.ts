import gsap from 'gsap';
import type { PlayerId } from '../types';
import { keypadEls } from '../ui/keypad';
import { activeTo } from '../ui/screens';
import { D, EASE } from './easings';

/** Desfoque que deixa os números ilegíveis para quem vai procurar. Se ainda der para ler, suba para 20. */
export const BLUR_PX = 14;

export const BLURRED = `blur(${BLUR_PX}px) brightness(0.6)`;
export const SHARP = 'blur(0px) brightness(1)';

export function challengeTl(chooser: PlayerId) {
  const { layer, panel, avatar } = keypadEls;
  return gsap
    .timeline()
    .to('#board', { filter: BLURRED, duration: D(0.4), ease: 'power2.out' }, 0)
    .add(activeTo(chooser, D(0.4)), 0)
    .set(layer, { autoAlpha: 1 }, D(0.1))
    .fromTo(
      panel,
      { y: 60, scale: 0.9, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: D(0.45), ease: 'back.out(1.4)' },
      D(0.1),
    )
    .fromTo(avatar, { rotation: -10, scale: 0.8 }, { rotation: 0, scale: 1, duration: D(0.4), ease: EASE.bounce }, D(0.2));
}
