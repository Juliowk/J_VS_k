import gsap from 'gsap';
import { IDS, PLAYERS } from '../players';
import { fmt, fmtTotal } from '../timer';
import type { PlayerId } from '../types';
import { D } from '../anim/easings';
import { $ } from './dom';

const playerEls = (id: PlayerId) => {
  const root = $(`.hud-player[data-player="${id}"]`);
  return { root, total: $('.total-value', root), role: $('.role-text', root) };
};

export const hudEls = {
  get hud() { return $('.hud'); },
  get foot() { return $('.footbar'); },
  get target() { return $('#hud-target'); },
  get timer() { return $('#hud-timer'); },
  get round() { return $('#round-info'); },
  player: (id: PlayerId) => playerEls(id),
};

export function setTimer(ms: number) {
  hudEls.timer.textContent = fmt(ms);
}

export function setTimerColor(id: PlayerId | null) {
  hudEls.timer.style.setProperty('--timer-color', id ? PLAYERS[id].accent : 'var(--bone)');
}

export function setTarget(n: number | null) {
  hudEls.target.textContent = n === null ? '—' : String(n);
}

export function renderTotal(id: PlayerId, ms: number) {
  hudEls.player(id).total.textContent = fmtTotal(ms);
}

export function setRound(index: number, remaining: number) {
  hudEls.round.textContent = `RODADA ${index} · ${remaining} ${remaining === 1 ? 'RESTANTE' : 'RESTANTES'}`;
}

/** Rótulos de papel com fade cruzado. */
export function setRoles(chooser: PlayerId, seeker: PlayerId) {
  const roles = IDS.map((id) => hudEls.player(id).role);
  const apply = () => {
    for (const id of IDS) {
      const p = hudEls.player(id);
      p.role.textContent = id === chooser ? 'ESCOLHE' : 'PROCURA';
      p.root.classList.toggle('is-seeker', id === seeker);
    }
  };
  return gsap
    .timeline()
    .to(roles, { opacity: 0, duration: D(0.15), ease: 'power1.in' })
    .add(apply)
    .to(roles, { opacity: 1, duration: D(0.2), ease: 'power1.out' });
}

export function resetHud(total: number) {
  setTimer(0);
  setTimerColor(null);
  setTarget(null);
  for (const id of IDS) {
    renderTotal(id, 0);
    const p = hudEls.player(id);
    p.role.textContent = '—';
    p.root.classList.remove('is-seeker');
  }
  setRound(1, total);
}
