import { Router } from 'express';

const router: Router = Router();

// GET /api/v1/me
router.get('/', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

// PATCH /api/v1/me/settings
router.patch('/settings', (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

export default router;
