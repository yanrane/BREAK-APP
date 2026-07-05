import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { getWIBStartOfDay } from '../lib/dateUtils';
import { computeMissionRewards } from './progressionService';

/** Returns missions assigned to the user today (since WIB midnight). */
export async function getTodayMissions(userId: string) {
  const todayStart = getWIBStartOfDay();
  return prisma.userMission.findMany({
    where: {
      userId,
      assignedAt: {
        gte: todayStart,
        lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: { mission: true },
    orderBy: { assignedAt: 'asc' },
  });
}

/**
 * Marks a mission as VERIFIED and awards points to the user (Phase 1: auto-verify).
 * Throws MISSION_NOT_FOUND (404) or MISSION_ALREADY_COMPLETED (409) on errors.
 */
export async function completeMission(
  userId: string,
  userMissionId: string,
  proofPath: string,
) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
    include: { mission: true },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }

  if (userMission.status !== 'ASSIGNED') {
    throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
  }

  const now = new Date();
  const rewards = await computeMissionRewards(userId, userMission.mission.points, now);

  try {
    const [updated] = await prisma.$transaction([
      prisma.userMission.update({
        where: { id: userMissionId, status: 'ASSIGNED' },
        data: {
          status: 'VERIFIED',
          proofUrl: proofPath,
          completedAt: now,
          verifiedAt: now,
          pointsEarned: userMission.mission.points,
        },
        include: { mission: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: rewards.userData,
      }),
      ...(rewards.petData
        ? [prisma.pet.update({ where: { userId }, data: rewards.petData })]
        : []),
    ]);
    return {
      ...updated,
      rewards: {
        expGained: rewards.expGained,
        coinsGained: rewards.coinsGained,
        eventTitle: rewards.eventTitle,
      },
    };
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === 'P2025') {
      throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
    }
    throw err;
  }
}

/** Returns paginated mission history for the user, newest first. */
export async function getMissionHistory(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.userMission.findMany({
      where: { userId },
      include: { mission: true },
      orderBy: { assignedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userMission.count({ where: { userId } }),
  ]);

  return { items, total, page, limit };
}
