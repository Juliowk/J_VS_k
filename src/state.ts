import gsap from 'gsap';
import { SHARP, challengeTl } from './anim/challenge';
import { markTl } from './anim/mark';
import { missTl } from './anim/miss';
import { revealTl } from './anim/reveal';
import { startTension, stopTension } from './anim/tension';
import { renderVictory } from './anim/victory';
import { buildBoard } from './board';
import { IDS, other } from './players';
import { Timer } from './timer';
import type { Chip, MatchResult, Phase, PlayerId, PlayerStats, Round } from './types';
import { $ } from './ui/dom';
import * as hud from './ui/hud';
import { resetKeypad } from './ui/keypad';
import { hide, setDim, show } from './ui/screens';

export const TOTAL = 50;
export const MISS_PENALTY_MS = 0;   // ex.: 1000 para +1 s por erro
export const COUNTDOWN = 3;

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

/**
 * Menor tempo total vence. Se o número de buscas for desigual
 * (partida encerrada no meio), compara pelo tempo médio.
 * Empate exato na resolução mostrada (centésimos).
 */
export function computeResult(): MatchResult {
  const stats = {} as Record<PlayerId, PlayerStats>;
  for (const id of IDS) {
    const done = game.rounds.filter((r) => r.seeker === id && r.timeMs !== undefined);
    const total = done.reduce((a, r) => a + r.timeMs!, 0);
    const fastest = done.reduce<Round | undefined>((b, r) => (!b || r.timeMs! < b.timeMs! ? r : b), undefined);
    stats[id] = {
      total,
      count: done.length,
      avg: done.length ? total / done.length : 0,
      best: fastest && { ms: fastest.timeMs!, n: fastest.target },
    };
  }
  const { julio: j, karen: k } = stats;
  const byAverage = j.count !== k.count;
  const comparable = j.count > 0 && k.count > 0;
  let winner: PlayerId | null = null;
  if (comparable) {
    const cs = (ms: number) => Math.round(ms / 10);
    const a = cs(byAverage ? j.avg : j.total), b = cs(byAverage ? k.avg : k.total);
    if (a !== b) winner = a < b ? 'julio' : 'karen';
  }
  return { winner, byAverage, comparable, stats };
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
    stopTension();
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

  async DESAFIO() {
    startRound();
    hud.setRoles(game.chooser, game.seeker);
    setDim(game.seeker);
    resetKeypad(game.chooser);
    await challengeTl(game.chooser);
  },

  async REVELACAO(): Promise<Phase> {
    const { target, chooser, seeker } = game.current!;
    await revealTl({ target, chooser, seeker, count: COUNTDOWN });
    return 'BUSCA';
  },

  BUSCA() {
    timer.begin();
    startTension();
  },

  async ACERTO(): Promise<Phase> {
    const ms = timer.stop();
    stopTension();
    const chip = game.hit!;
    const round = game.current!;
    const from = game.totals[round.seeker];
    round.timeMs = ms;
    game.rounds.push(round);
    game.totals[round.seeker] += ms;
    chip.markedBy = round.seeker;
    await markTl({ chip, seeker: round.seeker, ms, from, to: game.totals[round.seeker] });
    return markedCount() === TOTAL ? 'FIM' : 'TROCA';
  },

  TROCA() {
    [game.chooser, game.seeker] = [game.seeker, game.chooser];
    hud.setTarget(null);
    return 'DESAFIO';
  },

  FIM() {
    timer.stop();   // uma busca interrompida pelo "Encerrar" não conta
    stopTension();
    gsap.set('#board', { filter: SHARP });
    hide(['#keypad-layer', '#game']);
    setDim(null);
    const result = computeResult();
    renderVictory(result);
    show(['#victory', '.hero', '.vs']);
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
    missTl(chip, MISS_PENALTY_MS);
  }
}

export const canEnd = () => (game.phase === 'DESAFIO' || game.phase === 'BUSCA') && !game.locked;

export function endMatch() {
  void go('FIM');
}

export function rematch() {
  if (game.phase === 'FIM' && !game.locked) void go('INTRO');
}

export function backToMenu() {
  if (game.phase === 'FIM' && !game.locked) void go('MENU');
}
