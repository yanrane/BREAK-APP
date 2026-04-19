import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// PATCH /me/settings — stub until Prompt 3
router.patch('/settings', requireAuth, (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
});

export default router;
