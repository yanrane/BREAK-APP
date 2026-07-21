import prisma from '../lib/prisma';
import { ACHIEVEMENTS, AchievementStats } from '../lib/achievements';
import { petLevel } from '../lib/petLevel';

async function gatherStats(userId: string): Promise<AchievementStats> {
  const [user, missionsCompleted, quizCount, gameTypes] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { pet: true } }),
    prisma.userMission.count({ where: { userId, status: 'VERIFIED' } }),
    prisma.gameScore.count({ where: { userId, gameType: 'QUIZ' } }),
    prisma.gameScore.groupBy({ by: ['gameType'], where: { userId } }),
  ]);

  return {
    missionsCompleted,
    longestStreak: user.longestStreak,
    quizCount,
    distinctGameTypes: gameTypes.length,
    petLevel: user.pet ? petLevel(user.pet.exp) : 0,
    totalPoints: user.totalPoints,
  };
}

/**
 * Cek semua achievement dan unlock yang baru terpenuhi (idempoten via
 * unique [userId, code]). Hadiah coins masuk sekali saat unlock.
 * Return achievement yang baru saja terbuka.
 */
export async function checkAchievements(userId: string) {
  const [stats, unlockedRows] = await Promise.all([
    gatherStats(userId),
    prisma.userAchievement.findMany({ where: { userId }, select: { code: true } }),
  ]);
  const unlockedCodes = new Set(unlockedRows.map((r) => r.code));

  const newlyUnlocked = ACHIEVEMENTS.filter(
    (a) => !unlockedCodes.has(a.code) && a.isUnlocked(stats),
  );
  if (newlyUnlocked.length === 0) return [];

  const totalCoins = newlyUnlocked.reduce((sum, a) => sum + a.coins, 0);
  await prisma.$transaction([
    prisma.userAchievement.createMany({
      data: newlyUnlocked.map((a) => ({ userId, code: a.code })),
      skipDuplicates: true,
    }),
    prisma.user.update({ where: { id: userId }, data: { coins: { increment: totalCoins } } }),
  ]);

  return newlyUnlocked.map(({ code, emoji, title, coins }) => ({ code, emoji, title, coins }));
}

/** Daftar semua achievement + status unlock user (untuk halaman Profil). */
export async function getAchievements(userId: string) {
  const rows = await prisma.userAchievement.findMany({ where: { userId } });
  const unlockedAt = new Map(rows.map((r) => [r.code, r.unlockedAt]));
  return ACHIEVEMENTS.map(({ code, emoji, title, description, coins }) => ({
    code,
    emoji,
    title,
    description,
    coins,
    unlockedAt: unlockedAt.get(code) ?? null,
  }));
}
