import { Router } from 'express';
import authRouter from './auth';
import meRouter from './me';
import usageLogsRouter from './usageLogs';
import missionsRouter from './missions';
import leaderboardRouter from './leaderboard';
import gamesRouter from './games';
import cronRouter from './cron';

const router: Router = Router();

router.use('/auth', authRouter);
router.use('/me', meRouter);
router.use('/usage-logs', usageLogsRouter);
router.use('/missions', missionsRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/games', gamesRouter);
router.use('/cron', cronRouter);

export default router;
