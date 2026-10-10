import gsap from 'gsap';
import { PLAYERS } from '../players';
import { sfx } from '../sfx';
import { fmtShort } from '../timer';
import type { Chip, PlayerId } from '../types';
import { $, center, h } from '../ui/dom';
import { hudEls, renderTotal } from '../ui/hud';
import { D } from './easings';
import { burst } from './particles';

interface MarkOpts {
  chip: Chip;
  seeker: PlayerId;
  ms: number;
  from: number;   // total antigo
  to: number;     // total novo
}

/** Tempo da busca voa em arco do cronômetro até o total de quem procurou. */
function flyTime(text: string, color: string, dest: HTMLElement) {
  const tl = gsap.timeline();
  const timer = hudEls.timer;
  const src = center(timer);
  const clone = h('div', {
    class: 'fly fly-time',
    text,
    style: { '--c': color, 'font-size': getComputedStyle(timer).fontSize },
  });
  $('#fx').append(clone);
  const w = clone.offsetWidth, hh = clone.offsetHeight;
  const dst = center(dest);
  const x0 = src.x - w / 2, y0 = src.y - hh / 2;
  const x1 = dst.x - w / 2, y1 = dst.y - hh / 2;
  const arc = Math.min(120, window.innerHeight * 0.12);
  const st = { t: 0 };
  const render = () => {
    const ey = 1 - Math.pow(1 - st.t, 2);   // y em power2.out, x linear
    gsap.set(clone, {
      x: x0 + (x1 - x0) * st.t,
      y: y0 + (y1 - y0) * ey + Math.sin(Math.PI * st.t) * arc,
      scale: 1 - 0.5 * st.t,
    });
  };
  render();
  tl.to(st, { t: 1, duration: D(0.55), ease: 'none', onUpdate: render })
    .to(clone, { opacity: 0, duration: D(0.1), onComplete: () => clone.remove() });
  return tl;
}

export function markTl({ chip, seeker, ms, from, to }: MarkOpts) {
  const { face, el } = chip;
  const color = PLAYERS[seeker].accent;
  const strokes = el.querySelectorAll('.chip-x path');
  const total = hudEls.player(seeker).total;
  const c = center(el);
  sfx.hit();

  gsap.killTweensOf(face);
  gsap.set(face, { x: 0 });

  const tl = gsap.timeline();

  // 1. Cronômetro pisca em branco
  tl.fromTo(hudEls.timer, { color: '#ffffff', scale: 1.12 }, { color, scale: 1, duration: D(0.4), ease: 'power2.out', clearProps: 'color,scale' }, 0);

  // 2. Pop
  tl.to(face, { scale: 1.35, duration: D(0.15), ease: 'power2.out' }, 0)
    // 4. Cor e forma do jogador (a transição de cor fica no CSS)
    .add(() => el.classList.add(`marked-${seeker}`), D(0.15))
    .to(face, { scale: 1, duration: D(0.3), ease: 'back.out(2)' }, D(0.15));

  // 3. X desenhado, um traço de cada vez
  tl.fromTo(strokes[0], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: D(0.18), ease: 'power2.out' }, D(0.15))
    .fromTo(strokes[1], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: D(0.18), ease: 'power2.out' }, D(0.23));

  // 5. Partículas: losangos âmbar para o Júlio, corações e estrelas rosa para a Karen
  tl.add(
    burst(c.x, c.y, seeker === 'julio'
      ? { colors: [color, '#FFD27F', '#FFFFFF'], shapes: ['diamond'], size: [8, 14] }
      : { colors: [color, '#FFC2DD', '#E9D7FF'], shapes: ['heart', 'star'], size: [10, 16] }),
    D(0.1),
  );

  // 6. Tempo voando até o total
  tl.add(flyTime(fmtShort(ms), color, total), D(0.2));

  // 7. Total rolando do valor antigo até o novo, com pulso no fim
  const counter = { v: from };
  tl.to(counter, { v: to, duration: D(0.6), ease: 'power2.out', onUpdate: () => renderTotal(seeker, counter.v) }, D(0.75))
    .fromTo(total, { scale: 1.15 }, { scale: 1, duration: D(0.3), ease: 'back.out(2)', clearProps: 'scale' });

  // Ficha apagada e desabilitada
  tl.to(el, { opacity: 0.5, duration: D(0.3) }, D(0.9))
    .add(() => {
      el.classList.add('is-done');
      el.disabled = true;
      gsap.set(el, { clearProps: 'opacity' });
      gsap.set(face, { clearProps: 'transform' });
      gsap.set(strokes, { clearProps: 'strokeDashoffset' });
      renderTotal(seeker, to);
    });

  return tl;
}
