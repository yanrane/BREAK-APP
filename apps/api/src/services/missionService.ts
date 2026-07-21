import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { getWIBStartOfDay } from '../lib/dateUtils';
import { computeMissionRewards } from './progressionService';
import { assertCompletable, assertStartWindowOpen } from '../lib/missionGuard';

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
 * Mulai sesi misi: catat startedAt dari jam server, status IN_PROGRESS.
 * Idempoten — kalau sudah IN_PROGRESS, kembalikan sesi berjalan (resume).
 * serverNow dikirim agar client bisa kalibrasi countdown tanpa percaya jam device.
 * timezone (IANA, dari client) hanya dipakai untuk jendela jam mulai — start baru
 * ditolak di luar 04:00–19:00 waktu lokal user; resume tidak terpengaruh.
 */
export async function startMission(userId: string, userMissionId: string, timezone?: string) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
    include: { mission: true },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }

  if (userMission.status === 'IN_PROGRESS') {
    return { userMission, serverNow: new Date().toISOString() };
  }
  if (userMission.status !== 'ASSIGNED') {
    throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
  }

  assertStartWindowOpen(new Date(), timezone);

  try {
    const updated = await prisma.userMission.update({
      where: { id: userMissionId, status: 'ASSIGNED' },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: { mission: true },
    });
    return { userMission: updated, serverNow: new Date().toISOString() };
  } catch (err: unknown) {
    // Race: status berubah di antara findUnique dan update
    if ((err as { code?: string })?.code === 'P2025') {
      throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
    }
    throw err;
  }
}

/** Batalkan sesi misi: kembali ke ASSIGNED, startedAt dihapus (bisa dicoba ulang). */
export async function cancelMission(userId: string, userMissionId: string) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }
  if (userMission.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'MISSION_NOT_IN_PROGRESS', 'Misi tidak sedang berjalan');
  }

  try {
    return await prisma.userMission.update({
      where: { id: userMissionId, status: 'IN_PROGRESS' },
      data: { status: 'ASSIGNED', startedAt: null },
      include: { mission: true },
    });
  } catch (err: unknown) {
    // Race: misi keburu complete/berubah status
    if ((err as { code?: string })?.code === 'P2025') {
      throw new AppError(409, 'MISSION_NOT_IN_PROGRESS', 'Misi tidak sedang berjalan');
    }
    throw err;
  }
}

/**
 * Selesaikan misi (Phase 1: auto-verify) setelah lolos validasi anti-curang:
 * status IN_PROGRESS, timer server sudah lewat, foto ada + belum pernah dipakai.
 */
export async function completeMission(
  userId: string,
  userMissionId: string,
  proofPath?: string,
  proofHash?: string,
) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
    include: { mission: true },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }

  const now = new Date();
  assertCompletable({
    status: userMission.status,
    proofType: userMission.mission.proofType,
    durationMinutes: userMission.mission.durationMinutes,
    startedAt: userMission.startedAt,
    hasProof: Boolean(proofPath && proofHash),
    now,
  });

  const rewards = await computeMissionRewards(userId, userMission.mission.points, now);

  try {
    const [updated] = await prisma.$transaction([
      prisma.userMission.update({
        where: { id: userMissionId, status: 'IN_PROGRESS' },
        data: {
          status: 'VERIFIED',
          proofUrl: proofPath ?? null,
          proofHash: proofHash ?? null,
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
    if (prismaErr?.code === 'P2002') {
      throw new AppError(400, 'PROOF_DUPLICATE', 'Foto ini sudah pernah dipakai sebagai bukti misi');
    }
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
