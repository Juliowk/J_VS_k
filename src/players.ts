import type { Player, PlayerId } from './types';

const base = import.meta.env.BASE_URL;

export const PLAYERS: Record<PlayerId, Player> = {
  julio: { id: 'julio', name: 'Júlio', avatar: `${base}avatars/julio.jpg`, accent: '#F2A93B', font: 'var(--font-j)' },
  karen: { id: 'karen', name: 'Karen', avatar: `${base}avatars/karen.jpg`, accent: '#FF5FA2', font: 'var(--font-k)' },
};

export const IDS: PlayerId[] = ['julio', 'karen'];

export const other = (p: PlayerId): PlayerId => (p === 'julio' ? 'karen' : 'julio');

export const COLORS = {
  bone: '#EDE6DA',
  error: '#E5484D',
  white: '#FFFFFF',
  ink: '#0B0F1A',
};
