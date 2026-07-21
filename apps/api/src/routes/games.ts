import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GameType } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { submitScore, getMyStats, getDailyQuiz, submitQuiz } from '../services/gameService';
import { QUESTIONS_PER_DAY } from '../lib/quizBank';
import { AppError } from '../lib/appError';

const router: Router = Router();

// QUIZ sengaja tidak ada di sini — skornya dinilai server via /quiz/submit,
// bukan disetor bebas oleh client
const submitScoreSchema = z.object({
  gameType: z.enum(['REACTION', 'FAST_CLICK', 'PATTERN_MATCH', 'SUDOKU', 'MEMORY', 'MATH_SPRINT']),
  score: z.number().int(),
});

const submitQuizSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3)).length(QUESTIONS_PER_DAY),
});

// POST /api/v1/games/submit
router.post('/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const result = submitScoreSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const saved = await submitScore(req.user!.id, result.data.gameType as GameType, result.data.score);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/games/quiz/today — soal kuis hari ini (tanpa kunci jawaban)
router.get('/quiz/today', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await getDailyQuiz(req.user!.id);
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/games/quiz/submit — nilai jawaban di server, sekali per hari
router.post('/quiz/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const result = submitQuizSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const graded = await submitQuiz(req.user!.id, result.data.answers);
    res.json({ success: true, data: graded });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/games/my-stats
router.get('/my-stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getMyStats(req.user!.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
