import { IDS, PLAYERS } from '../players';
import { fmtShort, fmtTotal } from '../timer';
import type { MatchResult, PlayerId } from '../types';
import { $, h } from '../ui/dom';

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
