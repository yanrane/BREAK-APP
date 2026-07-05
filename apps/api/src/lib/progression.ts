import { PetRarity, PetStage } from '@prisma/client';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Index hari kalender WIB (jumlah hari sejak epoch, batas 00:00 WIB). */
export function wibDayIndex(date: Date): number {
  return Math.floor((date.getTime() + WIB_OFFSET_MS) / (24 * 60 * 60 * 1000));
}

export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  lastBrokenStreak: number;
}

/**
 * Hitung streak baru saat user menyelesaikan misi (konsep Duolingo):
 * - Hari yang sama: streak tidak berubah.
 * - Tepat 1 hari setelah misi terakhir: streak +1.
 * - Lewat lebih dari 1 hari (atau misi pertama): streak putus, mulai dari 1.
 *   Nilai streak lama disimpan di lastBrokenStreak untuk Streak Recovery.
 */
export function nextStreak(
  current: { currentStreak: number; longestStreak: number; lastBrokenStreak: number; lastMissionDate: Date | null },
  now: Date,
): StreakUpdate {
  const today = wibDayIndex(now);
  const lastDay = current.lastMissionDate ? wibDayIndex(current.lastMissionDate) : null;

  let currentStreak: number;
  let lastBrokenStreak = current.lastBrokenStreak;

  if (lastDay === today) {
    currentStreak = current.currentStreak;
  } else if (lastDay === today - 1) {
    currentStreak = current.currentStreak + 1;
  } else {
    if (current.currentStreak > 0) lastBrokenStreak = current.currentStreak;
    currentStreak = 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(current.longestStreak, currentStreak),
    lastBrokenStreak,
  };
}

/** Batas EXP pet untuk naik ke stage berikutnya. */
export const STAGE_THRESHOLDS: Record<PetStage, number | null> = {
  EGG: 100, // menetas jadi BABY
  BABY: 500, // jadi TEEN
  TEEN: 1500, // jadi ADULT
  ADULT: null, // stage akhir
};

const STAGE_ORDER: PetStage[] = ['EGG', 'BABY', 'TEEN', 'ADULT'];

/** Stage pet berdasarkan total EXP pet. */
export function stageForExp(exp: number): PetStage {
  if (exp >= 1500) return 'ADULT';
  if (exp >= 500) return 'TEEN';
  if (exp >= 100) return 'BABY';
  return 'EGG';
}

export function isStageAtLeast(stage: PetStage, min: PetStage): boolean {
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(min);
}

/**
 * Roll rarity telur saat menetas. Semakin besar EXP user saat menetas,
 * semakin besar peluang rarity tinggi.
 * ponytail: bobot linear sederhana, ganti kurva kalau balancing diperlukan.
 */
export function rollRarity(userExpAtHatch: number, rng: () => number = Math.random): PetRarity {
  const bonus = Math.min(userExpAtHatch / 1000, 1); // 0..1
  const roll = rng();
  if (roll < 0.05 + 0.1 * bonus) return 'LEGENDARY';
  if (roll < 0.2 + 0.2 * bonus) return 'EPIC';
  if (roll < 0.5 + 0.3 * bonus) return 'RARE';
  return 'COMMON';
}

/** Fitur yang terbuka per stage pet. */
export function unlockedFeatures(stage: PetStage): string[] {
  const features: string[] = [];
  if (isStageAtLeast(stage, 'BABY')) features.push('emote');
  if (isStageAtLeast(stage, 'TEEN')) features.push('outfit');
  if (isStageAtLeast(stage, 'ADULT')) features.push('cosmetic');
  return features;
}
