import prisma from '../lib/prisma';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
}

export async function getLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime',
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.min(50, Math.max(1, limit));

  if (period === 'alltime') {
    const users = await prisma.user.findMany({
      where: { totalPoints: { gt: 0 } },
      orderBy: { totalPoints: 'desc' },
      take: safeLimit,
      select: { id: true, username: true, avatarUrl: true, totalPoints: true },
    });
    return users.map((u, idx) => ({
      rank: idx + 1,
      userId: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      points: u.totalPoints,
    }));
  }

  const periodStart = new Date(
    Date.now() - (period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000,
  );

  const [missionRows, gameRows] = await Promise.all([
    prisma.userMission.groupBy({
      by: ['userId'],
      where: { status: 'VERIFIED', verifiedAt: { gte: periodStart } },
      _sum: { pointsEarned: true },
    }),
    prisma.gameScore.groupBy({
      by: ['userId'],
      where: { playedAt: { gte: periodStart }, pointsEarned: { gt: 0 } },
      _sum: { pointsEarned: true },
    }),
  ]);

  const pointsMap = new Map<string, number>();
  for (const row of missionRows) {
    pointsMap.set(row.userId, (pointsMap.get(row.userId) ?? 0) + (row._sum.pointsEarned ?? 0));
  }
  for (const row of gameRows) {
    pointsMap.set(row.userId, (pointsMap.get(row.userId) ?? 0) + (row._sum.pointsEarned ?? 0));
  }

  const sorted = [...pointsMap.entries()]
    .filter(([, pts]) => pts > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, safeLimit);

  if (sorted.length === 0) return [];

  const userIds = sorted.map(([id]) => id);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return sorted
    .map(([userId, points], idx) => {
      const u = userMap.get(userId);
      if (!u) return null;
      return { rank: idx + 1, userId, username: u.username, avatarUrl: u.avatarUrl, points };
    })
    .filter((entry): entry is LeaderboardEntry => entry !== null);
}
