import gsap from 'gsap';
import { $, h } from '../ui/dom';
import { ICON } from '../ui/icons';
import { reduced } from './easings';

/** Todas as animações de fundo ficam nesta timeline, para poderem desacelerar juntas. */
export const ambientTl = gsap.timeline();

const BATS = 3;
const SPARKLES = 16;
const rnd = gsap.utils.random;

const VS_GLOW = {
  low: 'drop-shadow(rgba(255, 255, 255, 0.35) 0px 0px 18px) drop-shadow(rgb(0, 0, 0) 0px 6px 0px)',
  high: 'drop-shadow(rgba(255, 255, 255, 0.75) 0px 0px 34px) drop-shadow(rgb(0, 0, 0) 0px 6px 0px)',
};

function bats() {
  const box = $('.bats');
  for (let i = 0; i < BATS; i++) {
    const wing = h('div', { class: 'bat-wing', html: ICON.bat });
    const bat = h('div', { class: 'bat' }, wing);
    box.append(bat);
    const dur = rnd(8, 14);
    // Atravessa o lado do Júlio em arco; a diagonal recorta a saída
    const fly = gsap
      .timeline({ repeat: -1, repeatDelay: rnd(1, 4), repeatRefresh: true, delay: rnd(0, 6) })
      .fromTo(
        bat,
        { x: -80, y: () => window.innerHeight * rnd(0.1, 0.45), scale: () => rnd(0.6, 1.1) },
        { x: () => window.innerWidth * 0.62, duration: dur, ease: 'none' },
      )
      .to(bat, { y: () => `-=${window.innerHeight * rnd(0.08, 0.2)}`, duration: dur / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0)
      .to(wing, { scaleY: 0.35, duration: 0.14, yoyo: true, repeat: Math.round(dur / 0.14), ease: 'sine.inOut' }, 0);
    ambientTl.add(fly, 0);
  }
}

function sparkles() {
  const box = $('.sparkles');
  for (let i = 0; i < SPARKLES; i++) {
    const kind = i % 3 === 0 ? 'heart' : i % 3 === 1 ? 'star' : 'sparkle';
    const el = h('div', {
      class: `sparkle ${kind}`,
      html: ICON[kind],
      // Só na metade da Karen (à direita da diagonal)
      style: { left: `${rnd(52, 96)}%`, top: `${rnd(4, 94)}%` },
    });
    box.append(el);
    gsap.set(el, { opacity: 0.2, scale: rnd(0.6, 1.2) });
    const tw = gsap.to(el, {
      opacity: 1,
      y: rnd(-8, 8),
      rotation: rnd(-20, 20),
      duration: rnd(1.2, 2.8),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    ambientTl.add(tw, rnd(0, 2.5));
  }
}

export function startAmbient() {
  bats();
  sparkles();
  if (reduced) {
    ambientTl.pause();
    return;
  }
  ambientTl
    .fromTo('.vs-text', { scale: 1, filter: VS_GLOW.low }, { scale: 1.06, filter: VS_GLOW.high, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0)
    .to('.hero-j .hero-breath', { scale: 1.03, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0)
    .to('.hero-k .hero-breath', { scale: 1.03, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 1.2)
    .fromTo('.fog', { xPercent: 0 }, { xPercent: -50, duration: 20, ease: 'none', repeat: -1 }, 0);
}

export function setAmbientSpeed(s: number, duration = 0.6) {
  if (!reduced) gsap.to(ambientTl, { timeScale: s, duration, overwrite: true });
}
