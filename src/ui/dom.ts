import { PLAYERS } from '../players';
import type { PlayerId } from '../types';

export function $<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
  return el;
}

export function $$<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

interface Props {
  class?: string;
  text?: string;
  html?: string;
  attrs?: Record<string, string>;
  style?: Record<string, string>;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.html !== undefined) el.innerHTML = props.html;
  for (const [k, v] of Object.entries(props.attrs ?? {})) el.setAttribute(k, v);
  for (const [k, v] of Object.entries(props.style ?? {})) el.style.setProperty(k, v);
  el.append(...children);
  return el;
}

/** Centro de um elemento em coordenadas da janela. */
export function center(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/** Preenche um contêiner `.avatar` com a foto do jogador, ou com a inicial se a foto não existir. */
export function fillAvatar(el: HTMLElement, id: PlayerId) {
  const p = PLAYERS[id];
  el.replaceChildren();
  el.classList.remove('is-julio', 'is-karen', 'fallback-julio', 'fallback-karen');
  el.classList.add(`is-${id}`);
  const img = h('img', { attrs: { src: p.avatar, alt: p.name, draggable: 'false' } });
  img.addEventListener('error', () => {
    el.classList.add(`fallback-${id}`);
    img.replaceWith(h('span', { class: 'avatar-initial', text: p.name[0] }));
  });
  el.append(img);
}

export function mountAvatars(root: ParentNode = document) {
  for (const el of $$<HTMLElement>('[data-avatar]', root)) {
    fillAvatar(el, el.dataset.avatar as PlayerId);
  }
}
