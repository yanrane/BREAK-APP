import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { getLeaderboard } from '../services/leaderboardService';
import { AppError } from '../lib/appError';

const router: Router = Router();

const leaderboardQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly', 'alltime']).default('weekly'),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

// GET /api/v1/leaderboard?period=weekly|monthly|alltime&limit=50
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const result = leaderboardQuerySchema.safeParse(req.query);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const entries = await getLeaderboard(result.data.period, result.data.limit);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

export default router;
