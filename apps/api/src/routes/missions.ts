import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { uploadProofMiddleware } from '../middleware/uploadProof';
import {
  getTodayMissions,
  completeMission,
  getMissionHistory,
} from '../services/missionService';

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

// POST /api/v1/missions/:userMissionId/complete
router.post(
  '/:userMissionId/complete',
  requireAuth,
  ...uploadProofMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await completeMission(
        req.user!.id,
        req.params.userMissionId,
        req.proofPath!,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
