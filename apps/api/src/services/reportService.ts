import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { STAGE_THRESHOLDS, unlockedFeatures } from '../lib/progression';
import { SHOP_ITEMS } from '../lib/shopItems';
import { getActiveEvent } from './progressionService';

/**
 * Rangkuman lengkap progres user (dipakai halaman Profile & Daily Report):
 * identitas, ranking global, streak, EXP, coins, pet, item, dan event aktif.
 */
export async function getReport(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { pet: true },
  });

  const [missionsCompleted, higherRanked, activeEvent] = await Promise.all([
    prisma.userMission.count({ where: { userId, status: 'VERIFIED' } }),
    prisma.user.count({ where: { totalPoints: { gt: user.totalPoints } } }),
    getActiveEvent(),
  ]);

  const pet = user.pet
    ? {
        ...user.pet,
        unlockedFeatures: unlockedFeatures(user.pet.stage),
        nextStageExp: STAGE_THRESHOLDS[user.pet.stage],
      }
    : null;

  return {
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      joinedAt: user.createdAt,
      totalPoints: user.totalPoints,
      exp: user.exp,
      coins: user.coins,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastBrokenStreak: user.lastBrokenStreak,
      onboardedAt: user.onboardedAt,
    },
    globalRank: higherRanked + 1,
    missionsCompleted,
    pet,
    ownedItems: SHOP_ITEMS.filter((i) => user.ownedItems.includes(i.id)),
    activeEvent,
  };
}

/**
 * Profil publik berdasarkan username. Hanya data non-sensitif —
 * tanpa id, email, gender, coins, atau settings.
 */
export async function getPublicProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { pet: true },
  });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan');
  }

  const [missionsCompleted, higherRanked] = await Promise.all([
    prisma.userMission.count({ where: { userId: user.id, status: 'VERIFIED' } }),
    prisma.user.count({ where: { totalPoints: { gt: user.totalPoints } } }),
  ]);

  return {
    username: user.username,
    avatarUrl: user.avatarUrl,
    joinedAt: user.createdAt,
    totalPoints: user.totalPoints,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    missionsCompleted,
    globalRank: higherRanked + 1,
    pet: user.pet
      ? { name: user.pet.name, stage: user.pet.stage, rarity: user.pet.rarity, hatchedAt: user.pet.hatchedAt }
      : null,
  };
}
