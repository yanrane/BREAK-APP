import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getActiveEvent } from '../services/progressionService';

const router: Router = Router();

// GET /api/v1/events/active — event yang sedang berlangsung (mis. 2x EXP), atau null
router.get('/active', requireAuth, async (_req, res, next) => {
  try {
    const event = await getActiveEvent();
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

export default router;
