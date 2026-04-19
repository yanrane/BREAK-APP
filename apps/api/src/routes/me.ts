import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { AppError } from '../lib/appError';
import prisma from '../lib/prisma';

const router: Router = Router();

const DEFAULT_TRACKED_DOMAINS = [
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'x.com',
  'twitter.com',
  'facebook.com',
];

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.user!.id } });
    res.json({ success: true, data: { user: req.user, settings } });
  } catch (err) {
    next(err);
  }
});

const settingsSchema = z.object({
  dailyLimitMinutes: z.number().int().min(1).max(1440).optional(),
  trackedDomains: z.array(z.string().min(1).max(255)).optional(),
  notificationEnabled: z.boolean().optional(),
});

router.patch('/settings', requireAuth, async (req, res, next) => {
  const result = settingsSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  if (Object.keys(result.data).length === 0) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Tidak ada field yang diupdate'));
  }
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      update: result.data,
      create: {
        userId: req.user!.id,
        dailyLimitMinutes: result.data.dailyLimitMinutes ?? 60,
        trackedDomains: result.data.trackedDomains ?? DEFAULT_TRACKED_DOMAINS,
        notificationEnabled: result.data.notificationEnabled ?? true,
      },
    });
    res.json({ success: true, data: { settings } });
  } catch (err) {
    next(err);
  }
});

export default router;
