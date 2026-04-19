import { GameType } from '@prisma/client';
import prisma from '../lib/prisma';
import { getWIBStartOfDay } from '../lib/dateUtils';

const DAILY_CAP = 20;

/**
 * Convert a game score (0-1000) to points (1-5).
 * - 0-199 → 1 point
 * - 200-399 → 2 points
 * - 400-599 → 3 points
 * - 600-799 → 4 points
 * - 800-1000 → 5 points
 *
 * Input is clamped to [0, 1000].
 */
export function calculateGamePoints(score: number): number {
  const clamped = Math.max(0, Math.min(1000, score));
  if (clamped >= 800) return 5;
  if (clamped >= 600) return 4;
  if (clamped >= 400) return 3;
  if (clamped >= 200) return 2;
  return 1;
}

/**
 * Apply daily cap (20 points/day from games) to a candidate points value.
 * Returns the actual points to award, capped at remaining budget.
 *
 * @param accumulated Current total points earned from games today
 * @param candidate Points candidate from this game submission
 * @returns Points to actually award (0 if cap reached)
 */
export function applyDailyCap(accumulated: number, candidate: number): number {
  return Math.max(0, Math.min(candidate, DAILY_CAP - accumulated));
}

export async function submitScore(
  userId: string,
  gameType: GameType,
  rawScore: number,
) {
  const clamped = Math.max(0, Math.min(1000, rawScore));
  const candidate = calculateGamePoints(clamped);

  const todayStart = getWIBStartOfDay();
  const aggregates = await prisma.gameScore.aggregate({
    where: { userId, playedAt: { gte: todayStart } },
    _sum: { pointsEarned: true },
  });
  const accumulated = aggregates._sum.pointsEarned ?? 0;
  const pointsEarned = applyDailyCap(accumulated, candidate);

  const [saved] = await prisma.$transaction([
    prisma.gameScore.create({
      data: { userId, gameType, score: clamped, pointsEarned },
    }),
    ...(pointsEarned > 0
      ? [prisma.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: pointsEarned } },
        })]
      : []),
  ]);

  return saved;
}

export async function getMyStats(userId: string) {
  const [grouped, recentScores] = await Promise.all([
    prisma.gameScore.groupBy({
      by: ['gameType'],
      where: { userId },
      _max: { score: true },
      _sum: { pointsEarned: true },
      _count: { id: true },
    }),
    prisma.gameScore.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: 10,
    }),
  ]);

  const byType: Record<string, { bestScore: number; totalSessions: number; totalPointsEarned: number }> = {};
  for (const row of grouped) {
    byType[row.gameType] = {
      bestScore: row._max.score ?? 0,
      totalSessions: row._count.id,
      totalPointsEarned: row._sum.pointsEarned ?? 0,
    };
  }

  return { byType, recentScores };
}
