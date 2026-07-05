import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { nextStreak, stageForExp, rollRarity } from '../lib/progression';

/** Event aktif saat ini (mis. 2x EXP), atau null. */
export async function getActiveEvent(now: Date = new Date()) {
  return prisma.event.findFirst({
    where: { startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { expMultiplier: 'desc' },
  });
}

export interface MissionRewards {
  expGained: number;
  coinsGained: number;
  eventTitle: string | null;
  userData: Prisma.UserUpdateInput;
  petData: Prisma.PetUpdateInput | null;
}

/**
 * Hitung reward penyelesaian misi: poin, EXP (dikali multiplier event aktif),
 * coins, update streak, dan perkembangan pet (termasuk menetas dari telur).
 * Hasilnya berupa data update yang dieksekusi caller dalam satu transaksi.
 */
export async function computeMissionRewards(
  userId: string,
  basePoints: number,
  now: Date = new Date(),
): Promise<MissionRewards> {
  const [user, event] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { pet: true } }),
    getActiveEvent(now),
  ]);

  const multiplier = event?.expMultiplier ?? 1;
  const expGained = Math.round(basePoints * multiplier);
  const coinsGained = basePoints;

  const streak = nextStreak(user, now);

  const userData: Prisma.UserUpdateInput = {
    totalPoints: { increment: basePoints },
    exp: { increment: expGained },
    coins: { increment: coinsGained },
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastBrokenStreak: streak.lastBrokenStreak,
    lastMissionDate: now,
  };

  let petData: Prisma.PetUpdateInput | null = null;
  if (user.pet) {
    const newPetExp = user.pet.exp + expGained;
    const newStage = stageForExp(newPetExp);
    petData = { exp: newPetExp, stage: newStage };
    if (user.pet.stage === 'EGG' && newStage !== 'EGG') {
      // Telur menetas: roll rarity berdasarkan EXP user saat menetas
      petData.rarity = rollRarity(user.exp + expGained);
      petData.hatchedAt = now;
      petData.name = 'Baby Pet';
    }
  }

  return { expGained, coinsGained, eventTitle: event?.title ?? null, userData, petData };
}
