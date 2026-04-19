import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { AppError } from '../lib/appError';
import { saveBatchUsageLogs, getDailySummary } from '../services/usageLogService';

const router: Router = Router();

const batchSchema = z.object({
  logs: z
    .array(
      z.object({
        domain: z.string().min(1).max(255),
        seconds: z.number().int().positive().max(3600),
        loggedAt: z.string().datetime(),
      }),
    )
    .min(1)
    .max(100),
});

const summaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
});

router.post('/', requireAuth, async (req, res, next) => {
  const result = batchSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const entries = result.data.logs.map((l) => ({
      domain: l.domain,
      seconds: l.seconds,
      loggedAt: new Date(l.loggedAt),
    }));
    await saveBatchUsageLogs(req.user!.id, entries);
    res.json({ success: true, data: { saved: entries.length } });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', requireAuth, async (req, res, next) => {
  const result = summaryQuerySchema.safeParse(req.query);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const summary = await getDailySummary(req.user!.id, result.data.date);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

export default router;
