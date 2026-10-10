export const EASE = {
  out: 'power3.out',
  in: 'power3.in',
  bounce: 'back.out(1.6)',
  spring: 'elastic.out(1, 0.6)',
  snap: 'expo.out',
};

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Encurta tudo se o usuário pediu menos movimento.
 * Pausas de leitura (contagem, faixas) não passam por aqui, para continuarem legíveis.
 */
export const D = (s: number) => (reduced ? 0.01 : s);
