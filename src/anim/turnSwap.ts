import gsap from 'gsap';
import { PLAYERS } from '../players';
import { sfx } from '../sfx';
import type { PlayerId } from '../types';
import { $ } from '../ui/dom';
import { D } from './easings';

const BG: Record<PlayerId, string> = {
  julio: 'linear-gradient(100deg, #F2A93B 0%, #FFD27F 50%, #F2A93B 100%)',
  karen: 'linear-gradient(100deg, #FF5FA2 0%, #FFB3D3 50%, #FF5FA2 100%)',
};

/**
 * Cortina diagonal na cor do próximo a escolher: Júlio entra pela esquerda, Karen pela direita.
 * `onMid` roda com a tela coberta (troca de cor ativa, iluminação e HUD).
 */
export function turnSwapTl(next: PlayerId, onMid: () => void) {
  const p = PLAYERS[next];
  const curtain = $('#curtain');
  const label = $('.curtain-label', curtain);
  label.textContent = `VEZ ${next === 'karen' ? 'DA' : 'DO'} ${p.name.toUpperCase()} ESCOLHER`;
  label.style.fontFamily = p.font;
  label.style.fontWeight = next === 'karen' ? '700' : '400';
  curtain.style.background = BG[next];

  const from = next === 'julio' ? -110 : 110;
  sfx.whoosh();
  return gsap
    .timeline()
    .set(curtain, { autoAlpha: 1, xPercent: from })
    .to(curtain, { xPercent: 0, duration: D(0.35), ease: 'power3.out' })
    .fromTo(label, { xPercent: from * 0.4, skewX: from > 0 ? 12 : -12 }, { xPercent: 0, skewX: 0, duration: D(0.45), ease: 'back.out(1.6)' }, 0)
    .add(onMid)
    .to(curtain, { xPercent: -from, duration: D(0.35), ease: 'power3.in' }, '+=0.3')
    .to(label, { xPercent: -from * 0.4, duration: D(0.35), ease: 'power3.in' }, '<')
    .set(curtain, { autoAlpha: 0 });
}
