import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getPublicProfile } from '../services/reportService';

const router: Router = Router();

// GET /api/v1/users/:username — profil publik (hanya data non-sensitif)
router.get('/:username', requireAuth, async (req, res, next) => {
  try {
    const profile = await getPublicProfile(req.params.username);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

export default router;
