import { Router, Request, Response, IRouter } from 'express';
import { assignMissionsForUser } from '../jobs/assignDailyMissions';
import prisma from '../lib/prisma';

const router: IRouter = Router();

// Called by Vercel Cron at 00:00 WIB (17:00 UTC) daily
// Protected by CRON_SECRET header set in Vercel env vars
router.get('/daily-missions', async (req: Request, res: Response) => {
  const secret = req.headers['x-cron-secret'] ?? req.headers.authorization?.replace('Bearer ', '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const results = await Promise.allSettled(users.map((u) => assignMissionsForUser(u.id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`[cron] daily-missions: ${users.length - failed}/${users.length} succeeded`);
    res.json({ success: true, data: { total: users.length, failed } });
  } catch (err) {
    console.error('[cron] daily-missions error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
