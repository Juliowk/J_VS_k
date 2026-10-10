export const LEVELS = { facil: 50, medio: 100, dificil: 150 } as const;
export type Level = keyof typeof LEVELS;

const KEY = 'jvk-level';
let current: Level = 'facil';

try {
  const saved = localStorage.getItem(KEY);
  if (saved && saved in LEVELS) current = saved as Level;
} catch { /* sem storage: fica no padrão */ }

export const getLevel = () => current;

export function setLevel(l: Level) {
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* idem */ }
}
