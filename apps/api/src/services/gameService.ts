import { GameType, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { getWIBStartOfDay } from '../lib/dateUtils';
import { stageForExp, rollRarity } from '../lib/progression';
import { petLevel, collectMilestones } from '../lib/petLevel';
import { getActiveEvent } from './progressionService';
import { checkAchievements } from './achievementService';
import { pickDailyQuestions, wibDateKey, QUESTIONS_PER_DAY } from '../lib/quizBank';

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
  const [aggregates, user, event] = await Promise.all([
    prisma.gameScore.aggregate({
      where: { userId, playedAt: { gte: todayStart } },
      _sum: { pointsEarned: true },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { pet: true } }),
    getActiveEvent(),
  ]);
  const accumulated = aggregates._sum.pointsEarned ?? 0;
  const pointsEarned = applyDailyCap(accumulated, candidate);

  // Reward game selaras dengan misi: EXP kena multiplier event, coins = poin,
  // pet ikut tumbuh — tapi TANPA menyentuh streak (streak khusus misi)
  const expGained = Math.round(pointsEarned * (event?.expMultiplier ?? 1));

  let petData: Prisma.PetUpdateInput | null = null;
  let coinsGained = pointsEarned;
  if (pointsEarned > 0 && user.pet) {
    const newPetExp = user.pet.exp + expGained;
    const newStage = stageForExp(newPetExp);
    petData = { exp: newPetExp, stage: newStage };
    if (user.pet.stage === 'EGG' && newStage !== 'EGG') {
      // Sama seperti misi: telur menetas → roll rarity dari EXP user saat menetas
      petData.rarity = rollRarity(user.exp + expGained);
      petData.hatchedAt = new Date();
    }
    // Milestone level pet (sampai lv 200): bonus coins + catat level terklaim
    const milestone = collectMilestones(user.pet.lastRewardLevel, petLevel(newPetExp));
    if (milestone.newLastRewardLevel > user.pet.lastRewardLevel) {
      petData.lastRewardLevel = milestone.newLastRewardLevel;
      coinsGained += milestone.coins;
    }
  }

  const [saved] = await prisma.$transaction([
    prisma.gameScore.create({
      data: { userId, gameType, score: clamped, pointsEarned },
    }),
    ...(pointsEarned > 0
      ? [prisma.user.update({
          where: { id: userId },
          data: {
            totalPoints: { increment: pointsEarned },
            exp: { increment: expGained },
            coins: { increment: coinsGained },
          },
        })]
      : []),
    ...(petData ? [prisma.pet.update({ where: { userId }, data: petData })] : []),
  ]);

  // Achievement dicek setelah reward masuk; gagal cek tidak boleh
  // menggagalkan submit skor
  try {
    await checkAchievements(userId);
  } catch (err) {
    console.error('[achievements] check gagal:', err);
  }

  return saved;
}

/** Kuis hari ini (soal tanpa kunci jawaban) + status sudah main atau belum. */
export async function getDailyQuiz(userId: string) {
  const dateKey = wibDateKey();
  const questions = pickDailyQuestions(dateKey);
  const played = await prisma.gameScore.findFirst({
    where: { userId, gameType: 'QUIZ', playedAt: { gte: getWIBStartOfDay() } },
    orderBy: { playedAt: 'desc' },
  });
  return {
    dateKey,
    alreadyPlayed: Boolean(played),
    lastScore: played?.score ?? null,
    questions: questions.map(({ id, topic, question, options }) => ({ id, topic, question, options })),
  };
}

/** Nilai jawaban kuis harian di server; sekali per hari per user. */
export async function submitQuiz(userId: string, answers: number[]) {
  const questions = pickDailyQuestions(wibDateKey());
  if (answers.length !== questions.length) {
    throw new AppError(400, 'VALIDATION_ERROR', `Jawaban harus ${questions.length} soal`);
  }

  // ponytail: guard find-then-create tanpa unique constraint — double-submit
  // super cepat bisa lolos; tambah constraint kalau kelak jadi masalah nyata
  const played = await prisma.gameScore.findFirst({
    where: { userId, gameType: 'QUIZ', playedAt: { gte: getWIBStartOfDay() } },
  });
  if (played) {
    throw new AppError(409, 'QUIZ_ALREADY_PLAYED', 'Kuis hari ini sudah dikerjakan. Balik lagi besok!');
  }

  const results = questions.map((q, i) => ({
    id: q.id,
    correctIndex: q.correctIndex,
    isCorrect: answers[i] === q.correctIndex,
  }));
  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correctCount / questions.length) * 1000);
  const saved = await submitScore(userId, 'QUIZ', score);

  return { correctCount, total: questions.length, results, saved };
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
