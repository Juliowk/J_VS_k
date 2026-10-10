import gsap from 'gsap';
import { $ } from '../ui/dom';
import { hudEls } from '../ui/hud';
import { setAmbientSpeed } from './ambient';
import { reduced } from './easings';

let pulse: gsap.core.Timeline | null = null;
let jitter: gsap.core.Tween | null = null;
let calls: gsap.core.Tween[] = [];

/** Vinheta pulsando na cor de quem procura; acelera aos 10 s, e o cronômetro treme aos 20 s. */
export function startTension() {
  stopTension();
  setAmbientSpeed(0.25);
  if (reduced) return;
  const glow = $('.frame-glow');
  pulse = gsap
    .timeline({ repeat: -1, yoyo: true })
    .fromTo(glow, { opacity: 0.35 }, { opacity: 1, duration: 0.8, ease: 'sine.inOut' });
  calls = [
    gsap.delayedCall(10, () => {
      if (pulse) gsap.to(pulse, { timeScale: 2.6, duration: 1 });
    }),
    gsap.delayedCall(20, () => {
      jitter = gsap.to(hudEls.timer, {
        x: 'random(-0.5, 0.5)',
        y: 'random(-0.5, 0.5)',
        duration: 0.05,
        repeat: -1,
        repeatRefresh: true,
        ease: 'none',
      });
    }),
  ];
}

export function stopTension() {
  pulse?.kill();
  jitter?.kill();
  calls.forEach((c) => c.kill());
  pulse = jitter = null;
  calls = [];
  setAmbientSpeed(1);
  gsap.to('.frame-glow', { opacity: 0.55, duration: 0.3, overwrite: true });
  gsap.set(hudEls.timer, { x: 0, y: 0 });
}
