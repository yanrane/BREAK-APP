import { Router } from 'express';

const router: Router = Router();

// POST /api/v1/usage-logs
router.post('/', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

// GET /api/v1/usage-logs/summary?date=YYYY-MM-DD
router.get('/summary', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

export default router;
