import { Router } from 'express';

const router: Router = Router();

// GET /api/v1/leaderboard?period=weekly|monthly|alltime
router.get('/', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

export default router;
