import prisma from '../lib/prisma';

export interface UsageLogEntry {
  domain: string;
  seconds: number;
  loggedAt: Date;
}

export async function saveBatchUsageLogs(userId: string, logs: UsageLogEntry[]): Promise<void> {
  if (logs.length === 0) return;
  await prisma.usageLog.createMany({
    data: logs.map((log) => ({
      userId,
      domain: log.domain,
      seconds: log.seconds,
      loggedAt: log.loggedAt,
    })),
  });
}

export async function getDailySummary(
  userId: string,
  date: string,
): Promise<{ domain: string; totalSeconds: number }[]> {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const rows = await prisma.usageLog.groupBy({
    by: ['domain'],
    where: { userId, loggedAt: { gte: dayStart, lte: dayEnd } },
    _sum: { seconds: true },
  });

  return rows
    .map((row) => ({ domain: row.domain, totalSeconds: row._sum.seconds ?? 0 }))
    .filter((row) => row.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}
