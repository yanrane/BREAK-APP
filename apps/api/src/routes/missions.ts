import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { promises as fsp } from 'fs';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { uploadProofMiddleware } from '../middleware/uploadProof';
import { AppError } from '../lib/appError';
import {
  getTodayMissions,
  startMission,
  cancelMission,
  completeMission,
  completeGpsMission,
  getMissionHistory,
  recordExitAttempt,
} from '../services/missionService';

// Maks 1500 titik ≈ 80KB JSON — muat di limit body parser, cukup untuk
// sesi ±1 jam dengan throttle 2.5 detik di client
const completeGpsSchema = z.object({
  points: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number(),
        t: z.number(),
        acc: z.number().optional(),
      }),
    )
    .min(2, 'Track GPS terlalu pendek')
    .max(1500, 'Track GPS terlalu panjang'),
});

const router: Router = Router();

// GET /api/v1/missions/today
router.get('/today', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const missions = await getTodayMissions(req.user!.id);
    res.json({ success: true, data: missions });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/missions/history?page=1&limit=20
router.get('/history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const result = await getMissionHistory(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/start — mulai sesi (startedAt = jam server)
router.post('/:userMissionId/start', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Timezone IANA dari client untuk jendela jam mulai; string bebas dibatasi 64 char,
    // nilai tidak valid jatuh ke WIB di dalam guard
    const timezone =
      typeof req.body?.timezone === 'string' ? req.body.timezone.slice(0, 64) : undefined;
    const result = await startMission(req.user!.id, req.params.userMissionId, timezone);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/complete-gps — selesaikan misi GPS
// (jarak dihitung ulang server dari titik mentah)
router.post('/:userMissionId/complete-gps', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const result = completeGpsSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const updated = await completeGpsMission(req.user!.id, req.params.userMissionId, result.data.points);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/exit — catat percobaan keluar Focus Mode
router.post('/:userMissionId/exit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await recordExitAttempt(req.user!.id, req.params.userMissionId);
    res.json({ success: true, data: { exitAttempts: updated.exitAttempts } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/cancel — batalkan sesi, kembali ke ASSIGNED
router.post('/:userMissionId/cancel', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await cancelMission(req.user!.id, req.params.userMissionId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/complete — file opsional (misi TIMER murni tanpa foto)
router.post(
  '/:userMissionId/complete',
  requireAuth,
  ...uploadProofMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await completeMission(
        req.user!.id,
        req.params.userMissionId,
        req.proofPath,
        req.proofHash,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      // Bersihkan file yatim kalau complete ditolak — dup/timer adalah jalur normal,
      // tanpa ini storage prod tumbuh terus tiap percobaan yang gagal
      if (req.proofPath) {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          import('@vercel/blob')
            .then(({ del }) => del(req.proofPath!))
            .catch(() => {});
        } else {
          const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
          fsp.unlink(path.join(uploadDir, path.basename(req.proofPath))).catch(() => {});
        }
      }
      next(err);
    }
  },
);

export default router;
