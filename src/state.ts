import gsap from 'gsap';
import { buildBoard } from './board';
import { PLAYERS, other } from './players';
import { Timer } from './timer';
import type { Chip, Phase, PlayerId, Round } from './types';
import { $ } from './ui/dom';
import * as hud from './ui/hud';
import { keypadEls, resetKeypad } from './ui/keypad';
import { hide, show } from './ui/screens';

export const TOTAL = 50;
export const MISS_PENALTY_MS = 0;   // ex.: 1000 para +1 s por erro
export const COUNTDOWN = 3;
export const BLUR_PX = 14;

interface Game {
  phase: Phase;
  locked: boolean;
  modalOpen: boolean;
  chooser: PlayerId;
  seeker: PlayerId;
  totals: Record<PlayerId, number>;
  rounds: Round[];
  chips: Chip[];
  current: Round | null;
  hit: Chip | null;
}

export const game: Game = {
  phase: 'MENU',
  locked: false,
  modalOpen: false,
  chooser: 'julio',
  seeker: 'karen',
  totals: { julio: 0, karen: 0 },
  rounds: [],
  chips: [],
  current: null,
  hit: null,
};

export const timer = new Timer(hud.setTimer);

export const markedCount = () => game.chips.filter((c) => c.markedBy).length;
export const isTaken = (n: number) => game.chips.some((c) => c.n === n && c.markedBy);

export function setActive(id: PlayerId) {
  document.documentElement.style.setProperty('--active', PLAYERS[id].accent);
}

function setDim(dimmed: PlayerId | null) {
  $('.side-j').classList.toggle('dim', dimmed === 'julio');
  $('.side-k').classList.toggle('dim', dimmed === 'karen');
}

function newMatch() {
  timer.stop();
  game.totals = { julio: 0, karen: 0 };
  game.rounds = [];
  game.current = null;
  game.hit = null;
  game.chips = buildBoard($('#board'));
  hud.resetHud();
  setDim(null);
}

function startRound() {
  const index = game.rounds.length + 1;
  game.current = { index, chooser: game.chooser, seeker: game.seeker, target: 0, misses: 0 };
  hud.setRound(index, TOTAL - markedCount());
  hud.setTimer(0);
  hud.setTimerColor(game.seeker);
  hud.setTarget(null);
}

type Transition = (prev: Phase) => Promise<Phase | void> | Phase | void;

const transitions: Record<Phase, Transition> = {
  MENU() {
    timer.stop();
    hide(['#game', '#keypad-layer', '#victory']);
    show(['#menu', '.hero', '.vs']);
    setDim(null);
  },

  INTRO() {
    hide(['#menu', '#victory']);
    newMatch();
    return 'SORTEIO';
  },

  SORTEIO() {
    game.chooser = Math.random() < 0.5 ? 'julio' : 'karen';
    game.seeker = other(game.chooser);
    return 'SPAWN';
  },

  SPAWN() {
    hide(['.hero', '.vs']);
    show('#game');
    return 'DESAFIO';
  },

  DESAFIO() {
    startRound();
    hud.setRoles(game.chooser, game.seeker);
    setActive(game.chooser);
    setDim(null);
    gsap.set('#board', { filter: `blur(${BLUR_PX}px) brightness(0.6)` });
    resetKeypad(game.chooser);
    show(keypadEls.layer);
  },

  REVELACAO() {
    hide(keypadEls.layer);
    hud.setTarget(game.current!.target);
    setActive(game.seeker);
    setDim(game.chooser);
    gsap.set('#board', { filter: 'blur(0px) brightness(1)' });
    return 'BUSCA';
  },

  BUSCA() {
    timer.begin();
  },

  ACERTO() {
    const ms = timer.stop();
    const chip = game.hit!;
    const round = game.current!;
    round.timeMs = ms;
    game.rounds.push(round);
    game.totals[round.seeker] += ms;
    chip.markedBy = round.seeker;
    chip.el.classList.add(`marked-${round.seeker}`);
    chip.el.disabled = true;
    hud.renderTotal(round.seeker, game.totals[round.seeker]);
    return markedCount() === TOTAL ? 'FIM' : 'TROCA';
  },

  TROCA() {
    [game.chooser, game.seeker] = [game.seeker, game.chooser];
    hud.setTarget(null);
    return 'DESAFIO';
  },

  FIM() {
    timer.stop();
    hide(['#keypad-layer', '#game']);
  },
};

/** Única forma de mudar de fase. */
export async function go(next: Phase) {
  const prev = game.phase;
  game.phase = next;
  document.body.dataset.phase = next;
  game.locked = true;
  const then = await transitions[next](prev);
  if (game.phase !== next) return;
  game.locked = false;
  if (then) void go(then);
}

/* ---------- Ações dos jogadores ---------- */

export const canType = () => game.phase === 'DESAFIO' && !game.locked && !game.modalOpen;

export function chooseTarget(n: number) {
  if (!canType()) return;
  game.current!.target = n;
  void go('REVELACAO');
}

export function clickChip(chip: Chip) {
  if (game.phase !== 'BUSCA' || game.locked || game.modalOpen || chip.markedBy) return;
  if (chip.n === game.current!.target) {
    game.hit = chip;
    void go('ACERTO');
  } else {
    game.current!.misses++;
    if (MISS_PENALTY_MS > 0) timer.add(MISS_PENALTY_MS);
  }
}

export const canEnd = () => (game.phase === 'DESAFIO' || game.phase === 'BUSCA') && !game.locked;

export function endMatch() {
  void go('FIM');
}
