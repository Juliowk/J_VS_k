import gsap from 'gsap';
import { PLAYERS } from '../players';
import { sfx } from '../sfx';
import type { PlayerId } from '../types';
import { D, reduced } from '../anim/easings';
import { $, fillAvatar, h } from './dom';

export interface KeypadOpts {
  canInput: () => boolean;
  max: () => number;   // maior número do nível
  isTaken: (n: number) => boolean;
  onSubmit: (n: number) => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
const KEY_LABEL: Record<string, string> = { C: 'Limpar', '⌫': 'Apagar' };

export const keypadEls = {
  get layer() { return $('#keypad-layer'); },
  get panel() { return $('#keypad'); },
  get field() { return $('#kp-field'); },
  get display() { return $('#kp-display'); },
  get msg() { return $('#kp-msg'); },
  get keys() { return $('#kp-keys'); },
  get launch() { return $('#kp-launch'); },
  get avatar() { return $('.kp-avatar'); },
  get name() { return $('.kp-name'); },
};

let value = '';
let rejected = false;   // depois de um número recusado, o próximo dígito recomeça o campo
let opts: KeypadOpts;

const isValid = (v: string) => {
  const n = Number(v);
  return v !== '' && n >= 1 && n <= opts.max() && !opts.isTaken(n);
};

function render(flipLast: boolean) {
  const { display, launch } = keypadEls;
  display.replaceChildren(
    ...(value
      ? [...value].map((ch) => h('span', { class: 'digit', text: ch }))
      : [h('span', { class: 'digit placeholder', text: '—' })]),
  );
  if (flipLast && value) {
    gsap.from(display.lastElementChild, { rotationX: -90, opacity: 0, duration: D(0.22), ease: 'back.out(2)' });
  }
  launch.classList.toggle('ready', isValid(value));
}

function press(el: Element | null) {
  if (el) gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: D(0.12), ease: 'power2.out', overwrite: true });
}

function clearError() {
  keypadEls.field.classList.remove('error');
  keypadEls.msg.textContent = '';
}

function handle(key: string) {
  press(keypadEls.keys.querySelector(`[data-key="${key}"]`));
  sfx.key();
  if (key === 'C') value = '';
  else if (key === '⌫') value = value.slice(0, -1);
  else value = value.length >= String(opts.max()).length || rejected ? key : value + key;
  rejected = false;
  clearError();
  render(/\d/.test(key));
}

function reject(message: string) {
  const { field, msg } = keypadEls;
  rejected = true;
  sfx.error();
  field.classList.add('error');
  msg.textContent = message;
  if (!reduced) {
    gsap.fromTo(field, { x: 0 }, { keyframes: { x: [-10, 10, -6, 6, 0] }, duration: 0.3, ease: 'none', overwrite: true });
  }
}

function submit() {
  press(keypadEls.launch);
  const n = Number(value);
  const max = opts.max();
  if (value === '' || n < 1 || n > max) return reject(`Escolha um número de 1 a ${max}`);
  if (opts.isTaken(n)) return reject('Esse número já foi');
  opts.onSubmit(n);
}

export function initKeypad(o: KeypadOpts) {
  opts = o;
  const { keys, launch } = keypadEls;
  keys.replaceChildren(
    ...KEYS.map((k) =>
      h('button', {
        class: 'kp-key',
        text: k,
        attrs: { type: 'button', 'data-key': k, 'aria-label': KEY_LABEL[k] ?? k },
      }),
    ),
  );

  keys.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('.kp-key');
    if (btn && opts.canInput()) handle(btn.dataset.key!);
  });
  launch.addEventListener('click', () => {
    if (opts.canInput()) submit();
  });

  window.addEventListener('keydown', (e) => {
    if (!opts.canInput()) return;
    if (/^\d$/.test(e.key)) handle(e.key);
    else if (e.key === 'Backspace') handle('⌫');
    else if (e.key === 'Delete') handle('C');
    else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else return;
    e.preventDefault();
  });
}

export function resetKeypad(chooser: PlayerId) {
  const p = PLAYERS[chooser];
  value = '';
  rejected = false;
  clearError();
  keypadEls.display.style.visibility = '';
  keypadEls.name.textContent = p.name;
  keypadEls.name.style.fontFamily = p.font;
  fillAvatar(keypadEls.avatar, chooser);
  render(false);
}
