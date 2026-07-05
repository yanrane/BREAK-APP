import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { AppError } from '../lib/appError';
import { SHOP_ITEMS } from '../lib/shopItems';
import { buyItem } from '../services/shopService';

const router: Router = Router();

// GET /api/v1/shop/items
router.get('/items', requireAuth, (_req, res) => {
  res.json({ success: true, data: SHOP_ITEMS });
});

const buySchema = z.object({ itemId: z.string().min(1) });

// POST /api/v1/shop/buy
router.post('/buy', requireAuth, async (req, res, next) => {
  const result = buySchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const purchase = await buyItem(req.user!.id, result.data.itemId);
    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
});

export default router;
