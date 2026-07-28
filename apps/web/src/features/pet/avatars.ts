/** Mirror daftar avatar dari API (apps/api/src/lib/avatars.ts) — data statis. */

export interface Avatar {
  id: string;
  emoji: string;
  label: string;
  level: number;
}

export const AVATARS: Avatar[] = [
  { id: 'chick', emoji: '🐣', label: 'Anak Ayam', level: 1 },
  { id: 'fox', emoji: '🦊', label: 'Rubah', level: 5 },
  { id: 'wolf', emoji: '🐺', label: 'Serigala', level: 10 },
  { id: 'owl', emoji: '🦉', label: 'Hantu', level: 15 },
  { id: 'eagle', emoji: '🦅', label: 'Elang', level: 20 },
  { id: 'dragon', emoji: '🐉', label: 'Naga', level: 30 },
  { id: 'lion', emoji: '🦁', label: 'Singa', level: 50 },
  { id: 'shark', emoji: '🦈', label: 'Hiu', level: 75 },
  { id: 'flame', emoji: '🔥', label: 'Api Abadi', level: 100 },
  { id: 'crown', emoji: '👑', label: 'Mahkota', level: 150 },
  { id: 'star', emoji: '🌟', label: 'Bintang', level: 200 },
];

export function avatarDataUri(emoji: string): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="48" font-size="48" text-anchor="middle">${emoji}</text></svg>`,
    )
  );
}
