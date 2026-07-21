import { Router } from 'express';
import authRouter from './auth';
import meRouter from './me';
import usageLogsRouter from './usageLogs';
import missionsRouter from './missions';
import leaderboardRouter from './leaderboard';
import gamesRouter from './games';
import cronRouter from './cron';
import shopRouter from './shop';
import eventsRouter from './events';
import feedbackRouter from './feedback';
import usersRouter from './users';
import achievementsRouter from './achievements';

const router: Router = Router();

router.use('/auth', authRouter);
router.use('/me', meRouter);
router.use('/usage-logs', usageLogsRouter);
router.use('/missions', missionsRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/games', gamesRouter);
router.use('/cron', cronRouter);
router.use('/shop', shopRouter);
router.use('/events', eventsRouter);
router.use('/feedback', feedbackRouter);
router.use('/users', usersRouter);
router.use('/achievements', achievementsRouter);

export default router;
