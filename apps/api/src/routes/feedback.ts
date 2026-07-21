import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { AppError } from '../lib/appError';
import prisma from '../lib/prisma';
import { createFeedbackSchema } from '../lib/schemas';

const router: Router = Router();

// POST /api/v1/feedback — kirim feedback baru (status awal NEW)
router.post('/', requireAuth, async (req, res, next) => {
  const result = createFeedbackSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const feedback = await prisma.feedback.create({
      data: { userId: req.user!.id, ...result.data },
    });
    res.status(201).json({ success: true, data: feedback });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/feedback/mine — riwayat feedback user beserta statusnya
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.feedback.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

export default router;
