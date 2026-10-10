import gsap from 'gsap';
import { sfx } from '../sfx';
import { D, EASE, reduced } from './easings';

/** Saída do menu: o JOGAR encolhe e some, e o fundo escurece. */
export function menuExitTl() {
  return gsap
    .timeline()
    .to('#btn-play', { scale: 0.9, duration: D(0.12), ease: 'power2.in' })
    .to('#btn-play', { opacity: 0, scale: 0.8, duration: D(0.2), ease: 'power2.in' })
    .to(['.menu-kicker', '.level-pick', '.menu-hint'], { opacity: 0, duration: D(0.25) }, '<')
    .to(['.hero', '.vs'], { opacity: 0, duration: D(0.3) }, '<')
    .to('.stage-shade', { autoAlpha: 1, duration: D(0.35) }, '<')
    .set('#menu', { autoAlpha: 0 })
    .set(['#btn-play', '.menu-kicker', '.level-pick', '.menu-hint'], { clearProps: 'opacity,transform' });
}

/** Entrada do menu (primeira carga e volta do fim de jogo). */
export function menuEnterTl() {
  return gsap
    .timeline()
    .set('#menu', { autoAlpha: 1 })
    .to('.stage-shade', { autoAlpha: 0, duration: D(0.4) }, 0)
    .fromTo('.vs', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: D(0.6), ease: EASE.bounce }, 0.1)
    .fromTo('.hero-j', { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: D(0.5), ease: EASE.out }, 0.15)
    .fromTo('.hero-k', { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: D(0.5), ease: EASE.out }, 0.15)
    .fromTo(['.menu-kicker', '.level-pick', '#btn-play', '.menu-hint'], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: D(0.45), ease: EASE.out, stagger: 0.08, clearProps: 'transform,opacity' }, 0.3);
}

/** Choque dos painéis: os dois lados se chocam no meio, flash, tremor, e o VS entra. */
export function introTl() {
  // Valores finais precisam estar no lugar antes dos .from() lerem o estado atual
  gsap.set(['.hero', '.vs'], { opacity: 1 });
  const impact = D(0.6);
  const tl = gsap
    .timeline()
    .to('.stage-shade', { autoAlpha: 0, duration: D(0.3) }, 0)
    .from('.side-j', { xPercent: -100, duration: impact, ease: 'power4.in' }, 0)
    .from('.side-k', { xPercent: 100, duration: impact, ease: 'power4.in' }, 0)
    .from('.seam', { opacity: 0, duration: 0.01 }, impact)
    .add(() => sfx.slam(), impact);

  if (!reduced) {
    tl.to('.flash', { opacity: 1, duration: 0.05 })
      .to('.flash', { opacity: 0, duration: 0.4 })
      .to('#app', { x: 'random(-6, 6)', y: 'random(-6, 6)', duration: 0.04, repeat: 7, yoyo: true }, '<')
      .set('#app', { clearProps: 'transform' });
  }

  return tl
    .from('.vs', { scale: 3, opacity: 0, duration: D(0.5), ease: EASE.bounce }, '-=0.3')
    .from('.hero-j', { x: -80, opacity: 0, duration: D(0.4), ease: EASE.out }, '-=0.3')
    .from('.hero-k', { x: 80, opacity: 0, duration: D(0.4), ease: EASE.out }, '<')
    .set(['.side-j', '.side-k', '.seam'], { clearProps: 'transform,opacity' });
}
