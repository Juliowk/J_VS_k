import gsap from 'gsap';
import { PLAYERS } from '../players';
import type { PlayerId } from '../types';
import { $ } from './dom';

type Target = gsap.TweenTarget;

export const show = (el: Target) => gsap.set(el, { autoAlpha: 1 });
export const hide = (el: Target) => gsap.set(el, { autoAlpha: 0 });

/** Escurece o lado de um jogador (ou nenhum). A transição de 0,4 s fica no CSS. */
export function setDim(dimmed: PlayerId | null) {
  $('.side-j').classList.toggle('dim', dimmed === 'julio');
  $('.side-k').classList.toggle('dim', dimmed === 'karen');
}

/** Troca `--active` na hora, sem animação. */
export function setActive(id: PlayerId) {
  document.documentElement.style.setProperty('--active', PLAYERS[id].accent);
}

/** Tween de `--active` até a cor do jogador. */
export const activeTo = (id: PlayerId, duration: number) =>
  gsap.to(document.documentElement, { '--active': PLAYERS[id].accent, duration, ease: 'power1.inOut' });
