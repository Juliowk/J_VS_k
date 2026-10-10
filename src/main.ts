import './styles/tokens.css';
import './styles/base.css';
import './styles/board.css';
import './styles/hud.css';
import './styles/slot.css';
import { startAmbient } from './anim/ambient';
import { initSlot } from './anim/slot';
import { enterFullscreen } from './fullscreen';
import { isMuted, setMuted } from './sfx';
import {
  backToMenu, canEnd, canType, chooseTarget, clickChip, endMatch, game, go, isTaken, rematch,
} from './state';
import { $, $$, mountAvatars } from './ui/dom';
import { ICON } from './ui/icons';
import { initKeypad } from './ui/keypad';
import { initModal } from './ui/modal';

mountAvatars();
for (const crown of $$('.crown')) crown.innerHTML = ICON.crown;

initKeypad({ canInput: canType, isTaken, onSubmit: chooseTarget });
initSlot();
startAmbient();

$('#btn-play').addEventListener('click', () => {
  if (game.phase !== 'MENU' || game.locked) return;
  void enterFullscreen();
  void go('INTRO');
});

const board = $('#board');
board.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLButtonElement>('.chip');
  const chip = el && game.chips.find((c) => c.el === el);
  if (chip) clickChip(chip);
});
board.addEventListener('contextmenu', (e) => e.preventDefault());

$('#btn-rematch').addEventListener('click', rematch);
$('#btn-menu').addEventListener('click', backToMenu);

const modal = initModal({
  canOpen: canEnd,
  onOpenChange: (open) => { game.modalOpen = open; },
  onConfirm: () => { if (canEnd()) endMatch(); },
});
$('#btn-end').addEventListener('click', modal.show);

/* Botão de mudo, com o estado salvo no navegador */
const mute = $('#btn-mute');
const renderMute = () => {
  const m = isMuted();
  mute.innerHTML = m ? ICON.soundOff : ICON.soundOn;
  mute.setAttribute('aria-pressed', String(m));
  mute.setAttribute('aria-label', m ? 'Som desligado' : 'Som ligado');
};
mute.addEventListener('click', () => {
  setMuted(!isMuted());
  renderMute();
});
renderMute();

if (import.meta.env.DEV) Object.assign(window, { __game: game });

void go('MENU');
