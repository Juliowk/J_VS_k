import gsap from 'gsap';
import { $, h } from '../ui/dom';
import { ICON } from '../ui/icons';
import { reduced } from './easings';

export type Shape = 'diamond' | 'heart' | 'star' | 'sparkle' | 'coin' | 'dot';

interface BurstOpts {
  count?: number;
  colors: string[];
  shapes: Shape[];
  dist?: [number, number];     // alcance em px
  size?: [number, number];     // tamanho em px
  dur?: [number, number];      // segundos
  gravity?: number;            // queda extra no fim, em px
  angle?: [number, number];    // faixa de ângulos em graus (0 = direita, 90 = baixo)
}

const SVG_SHAPES: Partial<Record<Shape, string>> = { heart: ICON.heart, star: ICON.star, sparkle: ICON.sparkle };

/** Explosão de partículas a partir de um ponto da tela. Cada partícula se remove ao terminar. */
export function burst(x: number, y: number, o: BurstOpts): gsap.core.Timeline {
  const tl = gsap.timeline();
  if (reduced) return tl;
  const {
    count = 18, colors, shapes, dist = [80, 160], size = [8, 14], dur = [0.6, 0.9], gravity = 40, angle = [0, 360],
  } = o;
  const fx = $('#fx');
  const rnd = gsap.utils.random;

  for (let i = 0; i < count; i++) {
    const shape = shapes[i % shapes.length];
    const el = h('div', {
      class: `p p-${shape}`,
      html: SVG_SHAPES[shape] ?? '',
      style: { '--c': colors[i % colors.length], '--s': `${rnd(size[0], size[1])}px` },
    });
    fx.append(el);

    const a = (rnd(angle[0], angle[1]) * Math.PI) / 180;
    const d = rnd(dist[0], dist[1]);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
    const rot0 = rnd(-40, 40), spin = rnd(-240, 240);
    const setX = gsap.quickSetter(el, 'x', 'px');
    const setY = gsap.quickSetter(el, 'y', 'px');
    const setS = gsap.quickSetter(el, 'scale');
    const setR = gsap.quickSetter(el, 'rotation', 'deg');
    const st = { t: 0 };
    const render = () => {
      const e = 1 - Math.pow(1 - st.t, 3);
      setX(x + dx * e);
      setY(y + dy * e + gravity * st.t * st.t);
      setS(1 - st.t * st.t);
      setR(rot0 + spin * st.t);
    };
    render();
    tl.to(st, { t: 1, duration: rnd(dur[0], dur[1]), ease: 'none', onUpdate: render, onComplete: () => el.remove() }, 0);
  }
  return tl;
}
