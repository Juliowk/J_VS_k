import gsap from 'gsap';
import { PLAYERS, other } from '../players';
import { sfx, startSpin, stopSpin } from '../sfx';
import type { PlayerId } from '../types';
import { $, $$, center, h } from '../ui/dom';
import { ICON } from '../ui/icons';
import { D, reduced } from './easings';
import { burst } from './particles';

type Sym = 'bat' | 'moon' | 'skull' | 'bow';

const SYMS: Record<PlayerId, Sym[]> = { julio: ['bat', 'moon'], karen: ['skull', 'bow'] };
const WIN_SYM: Record<PlayerId, Sym> = { julio: 'bat', karen: 'skull' };
const ALL: Sym[] = ['bat', 'moon', 'skull', 'bow'];
const WIN_INDEX = 22;   // posição do símbolo vencedor na faixa (há símbolos extras depois dele)
const LAMPS = 12;

const BANNER_BG: Record<PlayerId, string> = {
  julio: 'linear-gradient(120deg, #F2A93B, #FFD27F)',
  karen: 'linear-gradient(120deg, #FF5FA2, #FFB3D3)',
};

const els = () => {
  const layer = $('#slot-layer');
  return {
    layer,
    machine: $('#slot-machine'),
    lamps: $('#slot-lamps'),
    lever: $('#slot-lever'),
    reels: $$('.reel', layer),
    strips: $$('.strip', layer),
    winline: $('.slot-winline', layer),
    banner: $('#slot-banner'),
  };
};

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const symEl = (s: Sym) => h('div', { class: `sym sym-${s}`, html: ICON[s] });

/** Faixa aleatória que termina no símbolo do vencedor, cercado pelos símbolos do outro jogador. */
function fillStrip(strip: HTMLElement, winner: PlayerId) {
  const names = Array.from({ length: WIN_INDEX + 4 }, () => pick(ALL));
  const others = SYMS[other(winner)];
  names[WIN_INDEX - 1] = pick(others);
  names[WIN_INDEX] = WIN_SYM[winner];
  names[WIN_INDEX + 1] = pick(others);
  names[WIN_INDEX + 2] = pick(others);
  strip.replaceChildren(...names.map(symEl));
  gsap.set(strip, { y: 0, filter: 'none' });
}

/** "Clack" de parada: o rolo afunda de leve. */
const clack = (reel: HTMLElement) =>
  gsap
    .timeline()
    .add(() => sfx.clack())
    .to(reel, { scale: 0.97, duration: 0.05, ease: 'power1.out' })
    .to(reel, { scale: 1, duration: 0.05, ease: 'power1.in' });

/**
 * Giro em três fases com velocidades casadas: aceleração (power2.in), cruzeiro linear
 * com desfoque vertical, e frenagem com tranco (back.out). No último rolo a frenagem
 * passa um pouco do símbolo e volta, para dar suspense.
 */
function spinReel(reel: HTMLElement, strip: HTMLElement, dur: number, symH: number, suspense: boolean) {
  const dist = (WIN_INDEX - 1) * symH;
  const t1 = dur * 0.25, t2 = dur * 0.5;
  const over = suspense ? symH * 0.45 : 0;
  const t3 = suspense ? D(0.9) : dur * 0.25;
  const slope = suspense ? 3 : 5;   // velocidade inicial de power3.out e back.out(2)
  const v = (dist + over) / (t1 / 2 + t2 + t3 / slope);
  const d1 = (v * t1) / 2, d2 = v * t2;
  const blur = reduced ? 'none' : 'url(#vblur)';

  const tl = gsap
    .timeline()
    .to(strip, { y: -d1, duration: t1, ease: 'power2.in' })
    .set(strip, { filter: blur })
    .to(strip, { y: -(d1 + d2), duration: t2, ease: 'none' })
    .set(strip, { filter: 'none' });
  if (suspense) {
    tl.to(strip, { y: -(dist + over), duration: t3, ease: 'power3.out' })
      .to(strip, { y: -dist, duration: D(0.45), ease: 'back.out(3)' }, '+=0.12');
  } else {
    tl.to(strip, { y: -dist, duration: t3, ease: 'back.out(2)' });
  }
  return tl.add(clack(reel));
}

let lampTicker: gsap.core.Tween | null = null;

function blinkLamps(lamps: HTMLElement, every: number) {
  lampTicker?.kill();
  lampTicker = gsap.to({}, { duration: every, repeat: -1, onRepeat: () => lamps.classList.toggle('alt') });
}

function stopLamps() {
  lampTicker?.kill();
  lampTicker = null;
}

/** Avatar de quem começa cresce e brilha; o outro apaga. */
function heroHighlight(winner: PlayerId) {
  const win = $(`.hero[data-player="${winner}"]`);
  const lose = $(`.hero[data-player="${other(winner)}"]`);
  const glow = winner === 'julio' ? 'rgba(242,169,59,0.9)' : 'rgba(255,95,162,0.9)';
  return gsap
    .timeline()
    .fromTo(
      win,
      { scale: 1, filter: 'brightness(1) drop-shadow(0px 0px 0px rgba(255,255,255,0))' },
      { scale: 1.15, filter: `brightness(1.15) drop-shadow(0px 0px 36px ${glow})`, duration: D(0.6), ease: 'back.out(2)' },
      0,
    )
    .fromTo(lose, { opacity: 1, filter: 'grayscale(0)' }, { opacity: 0.4, filter: 'grayscale(0.7)', duration: D(0.6) }, 0);
}

export function initSlot() {
  const { lamps } = els();
  lamps.replaceChildren(...Array.from({ length: LAMPS }, () => h('span', { class: 'lamp' })));
}

export function slotTl(winner: PlayerId) {
  const { layer, machine, lamps, lever, reels, strips, winline, banner } = els();
  const p = PLAYERS[winner];
  strips.forEach((s) => fillStrip(s, winner));
  lamps.className = 'slot-lamps';
  lamps.style.setProperty('--win', p.accent);
  winline.style.setProperty('--winline', '#fff');

  const main = $('.banner-main', banner);
  main.textContent = `${p.name.toUpperCase()} COMEÇA!`;
  main.style.fontFamily = p.font;
  main.style.fontWeight = winner === 'karen' ? '700' : '400';
  banner.style.setProperty('--banner-bg', BANNER_BG[winner]);

  const symH = strips[0].firstElementChild!.getBoundingClientRect().height;
  const offY = -window.innerHeight * 1.2;

  const tl = gsap.timeline();

  // 1. A máquina cai do topo
  tl.set(layer, { autoAlpha: 1 })
    .set(banner, { autoAlpha: 0 })
    .fromTo(machine, { y: offY, x: 0 }, { y: 0, duration: D(0.7), ease: 'back.out(1.2)' })
    .add(() => sfx.slam(), D(0.5))
    // 2. Lâmpadas alternando âmbar e rosa
    .add(() => blinkLamps(lamps, 0.15), D(0.4));

  // 3. Alavanca desce, com tremor na máquina
  tl.to(lever, { rotation: 35, duration: D(0.2), ease: 'power2.in' }, '+=0.1')
    .add(() => sfx.lever(), '<')
    .to(lever, { rotation: 0, duration: D(0.2), ease: 'back.out(2)' });
  if (!reduced) tl.to(machine, { x: 'random(-5, 5)', duration: 0.04, repeat: 5, yoyo: true }, '<').set(machine, { x: 0 });

  // 4–6. Rolos partem juntos e param em sequência
  tl.addLabel('spin', '-=0.1').add(() => startSpin(), 'spin');
  [1.6, 2.1, 2.8].forEach((d, i) => tl.add(spinReel(reels[i], strips[i], D(d), symH, i === 2), 'spin'));

  // 7. Trinca fechada
  tl.add(() => {
    stopSpin();
    sfx.jackpot();
    lamps.classList.add('win');
    blinkLamps(lamps, 0.07);
    winline.style.setProperty('--winline', p.accent);
  })
    .fromTo(winline, { opacity: 0 }, { opacity: 1, duration: 0.08, repeat: 5, yoyo: true })
    .set(winline, { opacity: 1 })
    .set(banner, { autoAlpha: 1 })
    .fromTo(banner, { rotation: -12, scale: 0 }, { rotation: -2, scale: 1, duration: D(0.9), ease: 'elastic.out(1, 0.55)' }, '<')
    .add(heroHighlight(winner), '<')
    .add(() => {
      const c = center(banner);
      burst(c.x, c.y, {
        count: 28,
        colors: winner === 'julio' ? [p.accent, '#FFD27F'] : [p.accent, '#FFC2DD', '#E9D7FF'],
        shapes: winner === 'julio' ? ['coin'] : ['star', 'sparkle'],
        size: [14, 24],
        dist: [160, 320],
        dur: [0.9, 1.3],
        gravity: 120,
      });
    }, '<0.1');

  // 8. Saída
  tl.to(machine, { y: offY, duration: D(0.6), ease: 'power3.in' }, '+=1.3')
    .to(banner, { autoAlpha: 0, duration: D(0.4) }, '<')
    .add(stopLamps)
    .set(layer, { autoAlpha: 0 })
    .set(winline, { clearProps: 'opacity' });
  return tl;
}
