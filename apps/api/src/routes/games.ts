import { Router } from 'express';

const router: Router = Router();

// POST /api/v1/games/submit
router.post('/submit', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

// GET /api/v1/games/my-stats
router.get('/my-stats', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

export default router;
