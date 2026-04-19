import cron from 'node-cron';
import prisma from '../lib/prisma';
import { selectDailyMissions } from '../lib/missionSelector';
import { getWIBStartOfDay } from '../lib/dateUtils';

/** Assigns up to 3 missions for a single user, skipping if already assigned today. */
export async function assignMissionsForUser(userId: string): Promise<void> {
  const todayStart = getWIBStartOfDay();

  // Skip if user already has missions assigned today
  const existingCount = await prisma.userMission.count({
    where: {
      userId,
      assignedAt: {
        gte: todayStart,
        lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });
  if (existingCount > 0) return;

  // Find missions completed recently (within max cooldown of 48h)
  const recentCompletions = await prisma.userMission.findMany({
    where: {
      userId,
      status: { in: ['COMPLETED', 'VERIFIED'] }, // COMPLETED included for Phase 2 moderation flow
      completedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    include: { mission: { select: { id: true, cooldownHours: true } } },
  });

  const inCooldownIds = new Set<string>();
  for (const um of recentCompletions) {
    if (!um.completedAt) continue;
    const elapsedHours = (Date.now() - um.completedAt.getTime()) / (1000 * 60 * 60);
    if (elapsedHours < um.mission.cooldownHours) {
      inCooldownIds.add(um.missionId);
    }
  }

  const availableMissions = await prisma.mission.findMany({
    where: {
      isActive: true,
      id: { notIn: [...inCooldownIds] },
    },
    select: { id: true, category: true },
  });

  const selected = selectDailyMissions(availableMissions);
  if (selected.length === 0) return;

  await prisma.userMission.createMany({
    data: selected.map((m) => ({
      userId,
      missionId: m.id,
      status: 'ASSIGNED',
    })),
  });
}

/**
 * Starts the cron scheduler that assigns daily missions to all users at 00:00 WIB.
 * Call once during application initialization.
 */
export function startDailyMissionsCron(): void {
  // Runs at 00:00 every day in WIB (Asia/Jakarta = UTC+7)
  cron.schedule(
    '0 0 * * *',
    async () => {
      console.log('[cron] Assigning daily missions...');
      try {
        const users = await prisma.user.findMany({ select: { id: true } });
        await Promise.all(
          users.map(async (u) => {
            try {
              await assignMissionsForUser(u.id);
            } catch (err) {
              console.error(`[cron] Failed to assign missions for user ${u.id}:`, err);
            }
          }),
        );
        console.log(`[cron] Assigned missions for ${users.length} users`);
      } catch (err) {
        console.error('[cron] assignDailyMissions error:', err);
      }
    },
    { timezone: 'Asia/Jakarta' },
  );
}
