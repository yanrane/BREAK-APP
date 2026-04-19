import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { getWIBStartOfDay } from '../lib/dateUtils';

export async function getTodayMissions(userId: string) {
  const todayStart = getWIBStartOfDay();
  return prisma.userMission.findMany({
    where: {
      userId,
      assignedAt: { gte: todayStart },
    },
    include: { mission: true },
    orderBy: { assignedAt: 'asc' },
  });
}

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
  const [updated] = await prisma.$transaction([
    prisma.userMission.update({
      where: { id: userMissionId },
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
      data: { totalPoints: { increment: userMission.mission.points } },
    }),
  ]);

  return updated;
}

export async function getMissionHistory(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
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
