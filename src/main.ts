import './styles/tokens.css';
import './styles/base.css';
import './styles/board.css';
import './styles/hud.css';
import './styles/slot.css';
import { startAmbient } from './anim/ambient';
import { initSlot } from './anim/slot';
import { enterFullscreen } from './fullscreen';
import {
  backToMenu, canEnd, canType, chooseTarget, clickChip, endMatch, game, go, isTaken, rematch,
} from './state';
import { $, $$, mountAvatars } from './ui/dom';
import { ICON } from './ui/icons';
import { initKeypad } from './ui/keypad';
import { hide, show } from './ui/screens';

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

$('#board').addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLButtonElement>('.chip');
  const chip = el && game.chips.find((c) => c.el === el);
  if (chip) clickChip(chip);
});

$('#btn-rematch').addEventListener('click', rematch);
$('#btn-menu').addEventListener('click', backToMenu);

/* Modal de encerrar */
const modal = $('#modal');

function openModal() {
  if (!canEnd() || game.modalOpen) return;
  game.modalOpen = true;
  show(modal);
  $('#modal-cancel').focus();
}

function closeModal() {
  game.modalOpen = false;
  hide(modal);
}

$('#btn-end').addEventListener('click', openModal);
$('#modal-cancel').addEventListener('click', closeModal);
$('#modal-confirm').addEventListener('click', () => {
  closeModal();
  if (canEnd()) endMatch();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && game.modalOpen) closeModal();
});

if (import.meta.env.DEV) Object.assign(window, { __game: game });

void go('MENU');
