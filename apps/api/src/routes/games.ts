import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GameType } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { submitScore, getMyStats } from '../services/gameService';
import { AppError } from '../lib/appError';

const router: Router = Router();

const submitScoreSchema = z.object({
  gameType: z.enum(['REACTION', 'FAST_CLICK', 'PATTERN_MATCH']),
  score: z.number().int(),
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
