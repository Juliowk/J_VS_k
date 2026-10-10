import gsap from 'gsap';
import { IDS, PLAYERS, other } from '../players';
import { sfx } from '../sfx';
import { fmtShort, fmtTotal } from '../timer';
import type { MatchResult, PlayerId } from '../types';
import { $, $$, h } from '../ui/dom';
import { D, EASE, reduced } from './easings';

export const victoryEls = {
  get layer() { return $('#victory'); },
  get title() { return $('.victory-title'); },
  get sub() { return $('.victory-sub'); },
  get stats() { return $('.victory-stats'); },
  get actions() { return $('.victory-actions'); },
};

export function subtitle(r: MatchResult) {
  if (r.winner) return r.byAverage ? 'VITÓRIA · MENOR TEMPO MÉDIO' : 'VITÓRIA · MENOR TEMPO';
  return r.comparable ? 'TEMPOS IGUAIS' : 'SEM BUSCAS PARA COMPARAR';
}

function statCell(label: string, value: string, count?: number, note?: string) {
  const v = h('div', { class: 'stat-value', text: value });
  if (count !== undefined) v.dataset.count = String(count);
  if (note) v.append(' ', h('small', { text: note }));
  return h('div', { class: 'stat-cell' }, h('div', { class: 'stat-label', text: label }), v);
}

function statCard(r: MatchResult, id: PlayerId) {
  const s = r.stats[id];
  return h(
    'div',
    { class: `stat-card is-${id}${r.winner === id ? ' is-winner' : ''}` },
    h('div', { class: 'stat-name', text: PLAYERS[id].name }),
    h(
      'div',
      { class: 'stat-grid' },
      statCell('Tempo total', fmtTotal(s.total), s.total),
      statCell('Tempo médio', s.count ? fmtTotal(s.avg) : '—', s.count ? s.avg : undefined),
      statCell('Mais rápida', s.best ? fmtShort(s.best.ms) : '—', undefined, s.best ? `nº ${s.best.n}` : undefined),
      statCell('Buscas', String(s.count)),
    ),
  );
}

/** Monta o conteúdo do painel final. */
export function renderVictory(r: MatchResult) {
  const { title, sub, stats } = victoryEls;
  title.className = `victory-title is-${r.winner ?? 'tie'}`;
  title.textContent = r.winner ? `${PLAYERS[r.winner].name.toUpperCase()} VENCEU!` : 'EMPATE!';
  sub.replaceChildren(...[...subtitle(r)].map((ch) => h('span', { text: ch })));
  stats.replaceChildren(...IDS.map((id) => statCard(r, id)));
}

/* ---------- Confete (canvas, física simples) ---------- */

interface Bit { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string }

let confettiTick: (() => void) | null = null;

export function stopConfetti() {
  if (confettiTick) gsap.ticker.remove(confettiTick);
  confettiTick = null;
  const cv = $<HTMLCanvasElement>('#confetti');
  cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height);
}

function confetti(colors: string[], seconds = 3, count = 120) {
  stopConfetti();
  if (reduced) return;
  const cv = $<HTMLCanvasElement>('#confetti');
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr;
  cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = gsap.utils.random;
  const bits: Bit[] = Array.from({ length: count }, (_, i) => ({
    x: rnd(0, W),
    y: rnd(-H * 0.6, -10),
    vx: rnd(-2.5, 2.5),
    vy: rnd(1, 5),
    r: rnd(0, Math.PI * 2),
    vr: rnd(-0.25, 0.25),
    w: rnd(7, 12),
    h: rnd(10, 18),
    c: colors[i % colors.length],
  }));
  let t = 0;
  confettiTick = () => {
    const k = gsap.ticker.deltaRatio(60);
    t += gsap.ticker.deltaRatio(1);   // segundos desde o quadro anterior
    ctx.clearRect(0, 0, W, H);
    const fade = Math.max(0, Math.min(1, (seconds + 0.6 - t) / 0.6));
    ctx.globalAlpha = fade;
    for (const b of bits) {
      b.vy += 0.12 * k;
      b.vx *= 0.99;
      b.x += b.vx * k + Math.sin(t * 3 + b.r) * 0.6;
      b.y += b.vy * k;
      b.r += b.vr * k;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.r);
      ctx.scale(1, Math.cos(b.r * 2));   // "vira" no ar
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (fade <= 0) stopConfetti();
  };
  gsap.ticker.add(confettiTick);
}

/* ---------- Timeline da vitória ---------- */

const SPLIT: Record<PlayerId, [string, string]> = {
  julio: ['74%', '62%'],
  karen: ['38%', '26%'],
};

const GLOW: Record<PlayerId, [string, string]> = {
  julio: ['drop-shadow(rgba(242, 169, 59, 0.45) 0px 0px 18px)', 'drop-shadow(rgba(242, 169, 59, 1) 0px 0px 56px)'],
  karen: ['drop-shadow(rgba(255, 95, 162, 0.5) 0px 0px 18px)', 'drop-shadow(rgba(255, 95, 162, 1) 0px 0px 56px)'],
};

const side = (id: PlayerId) => $(id === 'julio' ? '.side-j' : '.side-k');
const hero = (id: PlayerId) => $(`.hero[data-player="${id}"]`);

/** Conta de 0 até o valor final nos números marcados com data-count. */
function countUp(els: HTMLElement[]) {
  const tl = gsap.timeline();
  for (const el of els) {
    const target = Number(el.dataset.count);
    const o = { v: 0 };
    tl.to(o, { v: target, duration: D(0.9), ease: 'power2.out', onUpdate: () => { el.textContent = fmtTotal(o.v); } }, 0);
  }
  return tl;
}

export function victoryTl(r: MatchResult) {
  renderVictory(r);
  const { layer, title, sub, stats, actions } = victoryEls;
  const w = r.winner;
  const ids: PlayerId[] = w ? [w] : IDS;
  const liftY = -window.innerHeight * 0.17;
  const remaining = $$('.chip:not(.is-done) .chip-face');
  const tl = gsap.timeline();

  // 1. Fichas restantes caem
  tl.to(remaining, {
    y: `+=${window.innerHeight}`,
    rotation: 'random(-200, 200)',
    duration: D(0.8),
    ease: 'power2.in',
    stagger: { each: 0.01, from: 'random' },
  }).to('#game', { autoAlpha: 0, duration: D(0.4) }, '-=0.3');

  // Palco volta, mais alto, sem o VS
  tl.add(() => {
    gsap.set(['.hero', '.vs'], { clearProps: 'all' });
    gsap.set('.vs', { autoAlpha: 0 });
    gsap.set('.hero', { y: liftY, autoAlpha: 0 });
    gsap.set(layer, { autoAlpha: 1 });
    gsap.set([title, sub.children, stats.children, actions], { opacity: 0 });
    sfx[w ? 'win' : 'tie']();
  });

  // 2–3. Diagonal avança sobre o lado de quem perdeu, que perde a cor
  if (w) {
    const l = other(w);
    tl.to(document.documentElement, { '--split-top': SPLIT[w][0], '--split-bot': SPLIT[w][1], duration: D(0.9), ease: 'power3.inOut' }, '>')
      .fromTo(side(l), { filter: 'grayscale(0)', opacity: 1 }, { filter: 'grayscale(1)', opacity: 0.6, duration: D(0.6) }, '<')
      .fromTo(
        hero(l),
        { autoAlpha: 0, scale: 0.5, filter: 'grayscale(0)' },
        { autoAlpha: 1, scale: 0.68, filter: 'grayscale(1)', duration: D(0.6), ease: EASE.out },
        '<0.2',
      );
  }

  // 4. Foto do vencedor (ou dos dois, no empate) cresce com brilho forte
  tl.addLabel('pop', w ? '<0.2' : '>');
  for (const id of ids) {
    const photo = $('.hero-photo', hero(id));
    tl.set(hero(id), { autoAlpha: 1 }, 'pop')
      .fromTo(photo, { scale: 0, filter: GLOW[id][0] }, { scale: 1, filter: GLOW[id][1], duration: D(1.1), ease: 'elastic.out(1, 0.5)' }, 'pop')
      .from($$('.hero-name, .hero-tag', hero(id)), { y: 20, opacity: 0, duration: D(0.4), ease: EASE.out, stagger: 0.08 }, 'pop+=0.3');
  }

  // 5. Coroa cai sobre a foto
  if (w) {
    tl.fromTo($('.crown', hero(w)), { y: -300, opacity: 0 }, { y: 0, opacity: 1, duration: D(0.8), ease: 'bounce.out' }, 'pop+=0.4');
  }

  // 6. Título e texto letra por letra
  tl.fromTo(title, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: D(0.5), ease: EASE.bounce }, 'pop+=0.5')
    .fromTo(sub.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: D(0.25), stagger: D(0.03), ease: EASE.out }, '<0.2');

  // 7. Estatísticas sobem e os números contam
  tl.fromTo(stats.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: D(0.5), stagger: D(0.1), ease: EASE.out }, '<0.3')
    .add(countUp($$<HTMLElement>('[data-count]', stats)), '<0.1');

  // 8. Confete
  tl.add(() => confetti(w ? [PLAYERS[w].accent, '#FFFFFF', w === 'julio' ? '#FFD27F' : '#FFC2DD'] : [PLAYERS.julio.accent, PLAYERS.karen.accent, '#FFFFFF']), 'pop');

  // 9. Botões
  tl.fromTo(actions, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: D(0.4), ease: EASE.out }, '>-0.2')
    .add(() => $('#btn-rematch').focus({ preventScroll: true }));
  return tl;
}

/** Sai da vitória e devolve o palco ao estado neutro. */
export function victoryExitTl() {
  return gsap
    .timeline()
    .add(stopConfetti)
    .to(['#victory', '.hero'], { autoAlpha: 0, duration: D(0.3) })
    .to(document.documentElement, { '--split-top': '58%', '--split-bot': '42%', duration: D(0.5), ease: 'power3.inOut' }, '<')
    .to(['.side-j', '.side-k'], { filter: 'grayscale(0)', opacity: 1, duration: D(0.4) }, '<')
    .add(resetVictoryStage);
}

export function resetVictoryStage() {
  stopConfetti();
  gsap.set(document.documentElement, { '--split-top': '58%', '--split-bot': '42%' });
  gsap.set(['.side-j', '.side-k', '.hero-photo', '.crown', '.hero-name', '.hero-tag'], { clearProps: 'all' });
}
