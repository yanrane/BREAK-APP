import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getAchievements } from '../services/achievementService';

const router: Router = Router();

// GET /api/v1/achievements — semua achievement + status unlock user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const achievements = await getAchievements(req.user!.id);
    res.json({ success: true, data: achievements });
  } catch (err) {
    next(err);
  }
});

export default router;
