import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { AppError } from '../lib/appError';
import prisma from '../lib/prisma';
import { getReport } from '../services/reportService';
import { AVATARS, avatarDataUri } from '../lib/avatars';
import { petLevel } from '../lib/petLevel';

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

const onboardingSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE']),
});

// POST /api/v1/me/onboarding — simpan gender & buat telur pet
router.post('/onboarding', requireAuth, async (req, res, next) => {
  const result = onboardingSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const [user, pet] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user!.id },
        data: { gender: result.data.gender, onboardedAt: new Date() },
        select: { id: true, gender: true, onboardedAt: true },
      }),
      prisma.pet.upsert({
        where: { userId: req.user!.id },
        update: {},
        create: { userId: req.user!.id },
      }),
    ]);
    res.json({ success: true, data: { user, pet } });
  } catch (err) {
    next(err);
  }
});

const avatarSchema = z.object({ avatarId: z.string().min(1).max(50) });

// PATCH /api/v1/me/avatar — pilih avatar profil (gate: level pet, dicek di server)
router.patch('/avatar', requireAuth, async (req, res, next) => {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'avatarId wajib diisi'));
  }
  try {
    const avatar = AVATARS.find((a) => a.id === parsed.data.avatarId);
    if (!avatar) {
      return next(new AppError(404, 'AVATAR_NOT_FOUND', 'Avatar tidak dikenal'));
    }
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user!.id },
      select: { exp: true },
    });
    const level = petLevel(pet?.exp ?? 0);
    if (level < avatar.level) {
      return next(
        new AppError(403, 'AVATAR_LOCKED', `Avatar ini terbuka di level pet ${avatar.level}`),
      );
    }
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: avatarDataUri(avatar.emoji) },
      select: { id: true, username: true, avatarUrl: true },
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me/report — daily report + data profil lengkap
router.get('/report', requireAuth, async (req, res, next) => {
  try {
    const report = await getReport(req.user!.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

export default router;
