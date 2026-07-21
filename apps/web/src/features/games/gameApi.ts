import api from '../../lib/api';

export interface GameScoreResult {
  id: string;
  score: number;
  pointsEarned: number;
  playedAt: string;
}

/** Game yang skornya disetor langsung; QUIZ dinilai server via endpoint sendiri. */
export type SubmittableGameType =
  | 'REACTION'
  | 'FAST_CLICK'
  | 'PATTERN_MATCH'
  | 'SUDOKU'
  | 'MEMORY'
  | 'MATH_SPRINT';

export async function submitGameScore(
  gameType: SubmittableGameType,
  score: number,
): Promise<GameScoreResult> {
  const res = await api.post<{ success: true; data: GameScoreResult }>('/games/submit', {
    gameType,
    score,
  });
  return res.data.data;
}

/** PRNG deterministik untuk puzzle harian (sama dengan server-side mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed angka dari tanggal lokal hari ini (YYYYMMDD) untuk tantangan harian. */
export function todaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
