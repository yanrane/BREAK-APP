import { Router } from 'express';

const router: Router = Router();

// GET /api/v1/missions/today
router.get('/today', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

// GET /api/v1/missions/history?page=1
router.get('/history', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

// POST /api/v1/missions/:userMissionId/complete
router.post('/:userMissionId/complete', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

export default router;
