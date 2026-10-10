import gsap from 'gsap';
import { PLAYERS } from '../players';
import { sfx } from '../sfx';
import type { PlayerId } from '../types';
import { $ } from '../ui/dom';
import { hudEls, setTarget } from '../ui/hud';
import { keypadEls } from '../ui/keypad';
import { activeTo, setDim } from '../ui/screens';
import { SHARP } from './challenge';
import { D, EASE, reduced } from './easings';

interface RevealOpts {
  target: number;
  chooser: PlayerId;
  seeker: PlayerId;
  count: number;
}

/** Morph (FLIP): um clone do número do painel viaja até o "ACHE O" do HUD. */
function morphTl(target: number, seeker: PlayerId) {
  const { layer, panel, display } = keypadEls;
  const dest = hudEls.target;
  setTarget(target);
  gsap.set(dest, { opacity: 0 });

  const src = display.getBoundingClientRect();
  const dst = dest.getBoundingClientRect();
  const clone = display.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.classList.add('fly');
  Object.assign(clone.style, {
    width: `${src.width}px`,
    height: `${src.height}px`,
    justifyContent: 'center',
    alignItems: 'center',
    color: getComputedStyle(display).color,
  });
  $('#fx').append(clone);
  display.style.visibility = 'hidden';

  const dx = dst.left + dst.width / 2 - (src.left + src.width / 2);
  const dy = dst.top + dst.height / 2 - (src.top + src.height / 2);
  const scale = dst.height / src.height;

  return gsap
    .timeline()
    .set(clone, { x: src.left, y: src.top })
    .to(clone, { x: src.left + dx, y: src.top + dy, scale, color: PLAYERS[seeker].accent, duration: D(0.6), ease: 'power3.inOut' }, 0)
    .to(panel, { scale: 0.8, opacity: 0, duration: D(0.35), ease: 'power2.in' }, 0)
    .set(layer, { autoAlpha: 0 }, D(0.35))
    .add(() => clone.remove(), D(0.6))
    .set(dest, { opacity: 1 }, D(0.6))
    .fromTo(dest, { scale: 1.35 }, { scale: 1, duration: D(0.3), ease: 'back.out(3)', clearProps: 'scale' }, D(0.6));
}

/** 3-2-1: os tempos não passam por D() para continuarem legíveis com menos movimento. */
function countdownTl(count: number) {
  const layer = $('#countdown');
  const num = $('.countdown-num', layer);
  const tl = gsap.timeline().set(layer, { autoAlpha: 1 });
  for (let i = count; i >= 1; i--) {
    const t = (count - i) * 0.6;
    const last = i === 1;
    tl.add(() => {
      num.textContent = String(i);
      sfx.count();
    }, t)
      .fromTo(num, { scale: reduced ? 1 : 2.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: EASE.out }, t)
      .to(num, { scale: reduced ? 1 : last ? 3 : 0.6, opacity: 0, duration: 0.2, ease: 'power2.in' }, t + 0.4);
  }
  return tl.set(layer, { autoAlpha: 0 });
}

export function revealTl({ target, chooser, seeker, count }: RevealOpts) {
  const tl = gsap.timeline();
  tl.add(morphTl(target, seeker), 0);

  // Troca de iluminação: acende quem procura, escurece quem escolheu
  tl.add(() => setDim(chooser), D(0.3)).add(activeTo(seeker, D(0.4)), D(0.3));

  // Contagem
  const start = D(0.6) + 0.15;
  tl.add(countdownTl(count), start);

  // Desembaçar rápido, junto com a explosão do "1"
  const unblur = start + (count - 1) * 0.6 + 0.4;
  tl.add(() => sfx.go(), unblur).to('#board', { filter: SHARP, duration: D(0.25), ease: EASE.snap }, unblur);
  return tl;
}
