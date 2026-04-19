# Leaderboard + Reaction Time Game + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 1 of BREAK by implementing the leaderboard (weekly/monthly/alltime), Reaction Time mini game with daily point cap, and Dashboard aggregation page.

**Architecture:** Backend adds `pointsEarned` to `GameScore` via migration, then implements `gameService` (pure scoring + daily cap logic) and `leaderboardService` (Prisma groupBy merge for period queries, direct totalPoints for alltime). Frontend adds hooks + page components following the same patterns as `useMissions`/`MissionCard`.

**Tech Stack:** Prisma migration, Zod validation, `getWIBStartOfDay()` (existing), React state machine for game, `useAuthStore` for self-highlight on leaderboard.

---

## File Map

**New files — backend:**
- `apps/api/src/services/gameService.ts` — `calculateGamePoints`, `applyDailyCap`, `submitScore`, `getMyStats`
- `apps/api/src/services/gameService.test.ts` — unit tests for pure functions
- `apps/api/src/services/leaderboardService.ts` — `getLeaderboard` (all 3 periods)
- `apps/api/src/test/games.integration.test.ts`
- `apps/api/src/test/leaderboard.integration.test.ts`

**Modified files — backend:**
- `apps/api/prisma/schema.prisma` — add `pointsEarned Int @default(0)` to `GameScore`
- `apps/api/src/routes/games.ts` — replace stubs with real handlers
- `apps/api/src/routes/leaderboard.ts` — replace stub with real handler

**New files — frontend:**
- `apps/web/src/features/games/ReactionGame.tsx`
- `apps/web/src/features/leaderboard/useLeaderboard.ts`
- `apps/web/src/features/dashboard/useDashboard.ts`

**Modified files — frontend:**
- `apps/web/src/pages/Games.tsx` — replace stub
- `apps/web/src/pages/Leaderboard.tsx` — replace stub
- `apps/web/src/pages/Dashboard.tsx` — replace stub

---

## Task 1: Schema migration — add pointsEarned to GameScore

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add pointsEarned field to GameScore model**

Edit `apps/api/prisma/schema.prisma` — replace the `GameScore` model:
```prisma
model GameScore {
  id           String   @id @default(cuid())
  userId       String
  gameType     GameType
  score        Int
  pointsEarned Int      @default(0)
  playedAt     DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 2: Run migration**

```bash
pnpm --filter @break/api db:migrate -- --name add-points-earned-to-game-score
```
Expected: new migration file created in `prisma/migrations/`, Prisma client regenerated.

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "chore(api): add pointsEarned to GameScore for period-based leaderboard queries"
```

---

## Task 2: gameService pure functions — TDD

**Files:**
- Create: `apps/api/src/services/gameService.test.ts`
- Create: `apps/api/src/services/gameService.ts` (pure functions only — submitScore added in Task 3)

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/services/gameService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateGamePoints, applyDailyCap } from './gameService';

describe('calculateGamePoints', () => {
  it.each([
    [0, 1],
    [199, 1],
    [200, 2],
    [399, 2],
    [400, 3],
    [599, 3],
    [600, 4],
    [799, 4],
    [800, 5],
    [1000, 5],
  ])('score %i → %i points', (score, expected) => {
    expect(calculateGamePoints(score)).toBe(expected);
  });

  it('clamps negative input — returns 1 point', () => {
    expect(calculateGamePoints(-50)).toBe(1);
  });

  it('clamps above-1000 input — returns 5 points', () => {
    expect(calculateGamePoints(1500)).toBe(5);
  });
});

describe('applyDailyCap', () => {
  it('awards full candidate when under cap', () => {
    expect(applyDailyCap(0, 5)).toBe(5);
  });

  it('partial award when near cap', () => {
    expect(applyDailyCap(18, 5)).toBe(2);
  });

  it('returns 0 when cap already reached', () => {
    expect(applyDailyCap(20, 5)).toBe(0);
  });

  it('returns 0 when accumulated exceeds cap', () => {
    expect(applyDailyCap(25, 5)).toBe(0);
  });

  it('awards exactly remaining when candidate exceeds gap', () => {
    expect(applyDailyCap(17, 5)).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @break/api test:unit -- src/services/gameService.test.ts
```
Expected: FAIL — "Cannot find module './gameService'"

- [ ] **Step 3: Implement pure functions**

Create `apps/api/src/services/gameService.ts`:
```typescript
import { GameType } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { getWIBStartOfDay } from '../lib/dateUtils';

const DAILY_CAP = 20;

export function calculateGamePoints(score: number): number {
  const clamped = Math.max(0, Math.min(1000, score));
  if (clamped >= 800) return 5;
  if (clamped >= 600) return 4;
  if (clamped >= 400) return 3;
  if (clamped >= 200) return 2;
  return 1;
}

export function applyDailyCap(accumulated: number, candidate: number): number {
  return Math.max(0, Math.min(candidate, DAILY_CAP - accumulated));
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm --filter @break/api test:unit -- src/services/gameService.test.ts
```
Expected: 13 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/gameService.ts apps/api/src/services/gameService.test.ts
git commit -m "feat(api): add calculateGamePoints and applyDailyCap with unit tests (TDD)"
```

---

## Task 3: gameService — submitScore and getMyStats

**Files:**
- Modify: `apps/api/src/services/gameService.ts`

- [ ] **Step 1: Add submitScore and getMyStats to gameService**

Append to `apps/api/src/services/gameService.ts` (after the existing exports):
```typescript
export async function submitScore(
  userId: string,
  gameType: GameType,
  rawScore: number,
) {
  const clamped = Math.max(0, Math.min(1000, rawScore));
  const candidate = calculateGamePoints(clamped);

  const todayStart = getWIBStartOfDay();
  const aggregates = await prisma.gameScore.aggregate({
    where: { userId, playedAt: { gte: todayStart } },
    _sum: { pointsEarned: true },
  });
  const accumulated = aggregates._sum.pointsEarned ?? 0;
  const pointsEarned = applyDailyCap(accumulated, candidate);

  const [saved] = await prisma.$transaction([
    prisma.gameScore.create({
      data: { userId, gameType, score: clamped, pointsEarned },
    }),
    ...(pointsEarned > 0
      ? [prisma.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: pointsEarned } },
        })]
      : []),
  ]);

  return saved;
}

export async function getMyStats(userId: string) {
  const scores = await prisma.gameScore.findMany({
    where: { userId },
    orderBy: { playedAt: 'desc' },
  });

  const byType: Record<string, { bestScore: number; totalSessions: number; totalPointsEarned: number }> = {};
  for (const s of scores) {
    if (!byType[s.gameType]) {
      byType[s.gameType] = { bestScore: 0, totalSessions: 0, totalPointsEarned: 0 };
    }
    const entry = byType[s.gameType];
    entry.totalSessions += 1;
    entry.totalPointsEarned += s.pointsEarned;
    if (s.score > entry.bestScore) entry.bestScore = s.score;
  }

  return { byType, recentScores: scores.slice(0, 10) };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/gameService.ts
git commit -m "feat(api): add submitScore and getMyStats to gameService"
```

---

## Task 4: Game integration tests

**Files:**
- Create: `apps/api/src/test/games.integration.test.ts`

- [ ] **Step 1: Create integration test file**

Create `apps/api/src/test/games.integration.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

let accessToken: string;
let userId: string;

beforeEach(async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'game@test.com', username: 'gametest', password: 'password123' });
  accessToken = res.body.data.accessToken;
  userId = res.body.data.user.id;
});

describe('POST /api/v1/games/submit', () => {
  it('saves score and increments totalPoints', async () => {
    const res = await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ gameType: 'REACTION', score: 800 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pointsEarned).toBe(5);
    expect(res.body.data.score).toBe(800);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.totalPoints).toBe(5);
  });

  it('enforces daily cap — stops awarding after 20 pts', async () => {
    // 4 sessions × 5 pts = 20 pts (cap reached)
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/v1/games/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ gameType: 'REACTION', score: 1000 });
    }

    const capRes = await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ gameType: 'REACTION', score: 1000 });

    expect(capRes.body.data.pointsEarned).toBe(0);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.totalPoints).toBe(20);
  });

  it('partial award when near cap', async () => {
    // 3 sessions × 5 pts = 15 pts accumulated
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/games/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ gameType: 'REACTION', score: 1000 });
    }

    // Next session would give 5 pts but only 5 remain (20-15=5) — full award
    const res = await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ gameType: 'REACTION', score: 1000 });

    expect(res.body.data.pointsEarned).toBe(5);
  });

  it('clamps out-of-range score', async () => {
    const res = await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ gameType: 'REACTION', score: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(1000);
  });

  it('returns 400 for invalid gameType', async () => {
    const res = await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ gameType: 'INVALID_GAME', score: 500 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/games/submit')
      .send({ gameType: 'REACTION', score: 500 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/games/my-stats', () => {
  it('returns stats grouped by game type', async () => {
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ gameType: 'REACTION', score: 750 });

    const res = await request(app)
      .get('/api/v1/games/my-stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.byType.REACTION).toMatchObject({
      bestScore: 750,
      totalSessions: 1,
      totalPointsEarned: expect.any(Number),
    });
    expect(res.body.data.recentScores).toHaveLength(1);
  });

  it('returns empty stats for new user', async () => {
    const res = await request(app)
      .get('/api/v1/games/my-stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.byType).toEqual({});
    expect(res.body.data.recentScores).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/games/my-stats');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
pnpm --filter @break/api test:integration -- src/test/games.integration.test.ts
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/test/games.integration.test.ts
git commit -m "test(api): add integration tests for games endpoints"
```

---

## Task 5: Replace game route stubs

**Files:**
- Modify: `apps/api/src/routes/games.ts`

- [ ] **Step 1: Replace games.ts**

Replace the full content of `apps/api/src/routes/games.ts`:
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GameType } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { submitScore, getMyStats } from '../services/gameService';
import { AppError } from '../lib/appError';

const router: Router = Router();

const submitScoreSchema = z.object({
  gameType: z.enum(['REACTION', 'FAST_CLICK', 'PATTERN_MATCH']),
  score: z.number().int(),
});

// POST /api/v1/games/submit
router.post('/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const result = submitScoreSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const saved = await submitScore(req.user!.id, result.data.gameType as GameType, result.data.score);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/games/my-stats
router.get('/my-stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getMyStats(req.user!.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 3: Run all tests to ensure no regression**

```bash
pnpm --filter @break/api test:integration
```
Expected: all integration tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/games.ts
git commit -m "feat(api): implement games endpoints — submit score and my-stats"
```

---

## Task 6: leaderboardService

**Files:**
- Create: `apps/api/src/services/leaderboardService.ts`

- [ ] **Step 1: Create leaderboardService**

Create `apps/api/src/services/leaderboardService.ts`:
```typescript
import prisma from '../lib/prisma';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
}

export async function getLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime',
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.min(50, Math.max(1, limit));

  if (period === 'alltime') {
    const users = await prisma.user.findMany({
      where: { totalPoints: { gt: 0 } },
      orderBy: { totalPoints: 'desc' },
      take: safeLimit,
      select: { id: true, username: true, avatarUrl: true, totalPoints: true },
    });
    return users.map((u, idx) => ({
      rank: idx + 1,
      userId: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      points: u.totalPoints,
    }));
  }

  const periodStart = new Date(
    Date.now() - (period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000,
  );

  const [missionRows, gameRows] = await Promise.all([
    prisma.userMission.groupBy({
      by: ['userId'],
      where: { status: 'VERIFIED', verifiedAt: { gte: periodStart } },
      _sum: { pointsEarned: true },
    }),
    prisma.gameScore.groupBy({
      by: ['userId'],
      where: { playedAt: { gte: periodStart }, pointsEarned: { gt: 0 } },
      _sum: { pointsEarned: true },
    }),
  ]);

  const pointsMap = new Map<string, number>();
  for (const row of missionRows) {
    pointsMap.set(row.userId, (pointsMap.get(row.userId) ?? 0) + (row._sum.pointsEarned ?? 0));
  }
  for (const row of gameRows) {
    pointsMap.set(row.userId, (pointsMap.get(row.userId) ?? 0) + (row._sum.pointsEarned ?? 0));
  }

  const sorted = [...pointsMap.entries()]
    .filter(([, pts]) => pts > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, safeLimit);

  if (sorted.length === 0) return [];

  const userIds = sorted.map(([id]) => id);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return sorted.map(([userId, points], idx) => {
    const u = userMap.get(userId)!;
    return { rank: idx + 1, userId, username: u.username, avatarUrl: u.avatarUrl, points };
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/leaderboardService.ts
git commit -m "feat(api): add leaderboardService with weekly/monthly/alltime period support"
```

---

## Task 7: Leaderboard integration tests

**Files:**
- Create: `apps/api/src/test/leaderboard.integration.test.ts`

- [ ] **Step 1: Create integration test file**

Create `apps/api/src/test/leaderboard.integration.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';

let tokenA: string;
let tokenB: string;
let userAId: string;

beforeEach(async () => {
  const resA = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'leader_a@test.com', username: 'leadera', password: 'password123' });
  tokenA = resA.body.data.accessToken;
  userAId = resA.body.data.user.id;

  const resB = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'leader_b@test.com', username: 'leaderb', password: 'password123' });
  tokenB = resB.body.data.accessToken;
});

describe('GET /api/v1/leaderboard', () => {
  it('returns empty array when no one has points', async () => {
    const res = await request(app)
      .get('/api/v1/leaderboard?period=weekly')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('weekly — sorted desc by points, excludes zero-point users', async () => {
    // User A earns 5 pts, User B earns nothing
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ gameType: 'REACTION', score: 1000 });

    const res = await request(app)
      .get('/api/v1/leaderboard?period=weekly')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      rank: 1,
      userId: userAId,
      username: 'leadera',
      points: 5,
    });
  });

  it('weekly — correct order when multiple users have points', async () => {
    // User A earns 5 pts
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ gameType: 'REACTION', score: 1000 });

    // User B earns 10 pts
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ gameType: 'REACTION', score: 1000 });
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ gameType: 'REACTION', score: 1000 });

    const res = await request(app)
      .get('/api/v1/leaderboard?period=weekly')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].points).toBeGreaterThan(res.body.data[1].points);
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[1].rank).toBe(2);
  });

  it('alltime — uses User.totalPoints, includes all non-zero users', async () => {
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ gameType: 'REACTION', score: 1000 });

    const res = await request(app)
      .get('/api/v1/leaderboard?period=alltime')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('points');
  });

  it('respects limit query param', async () => {
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ gameType: 'REACTION', score: 1000 });
    await request(app)
      .post('/api/v1/games/submit')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ gameType: 'REACTION', score: 1000 });

    const res = await request(app)
      .get('/api/v1/leaderboard?period=weekly&limit=1')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 400 for invalid period', async () => {
    const res = await request(app)
      .get('/api/v1/leaderboard?period=yearly')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/leaderboard');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
pnpm --filter @break/api test:integration -- src/test/leaderboard.integration.test.ts
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/test/leaderboard.integration.test.ts
git commit -m "test(api): add integration tests for leaderboard endpoint"
```

---

## Task 8: Replace leaderboard route stub

**Files:**
- Modify: `apps/api/src/routes/leaderboard.ts`

- [ ] **Step 1: Replace leaderboard.ts**

Replace the full content of `apps/api/src/routes/leaderboard.ts`:
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { getLeaderboard } from '../services/leaderboardService';
import { AppError } from '../lib/appError';

const router: Router = Router();

const leaderboardQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly', 'alltime']).default('weekly'),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

// GET /api/v1/leaderboard?period=weekly|monthly|alltime&limit=50
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const result = leaderboardQuerySchema.safeParse(req.query);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', result.error.errors[0]?.message ?? 'Input tidak valid'));
  }
  try {
    const entries = await getLeaderboard(result.data.period, result.data.limit);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 3: Run all integration tests**

```bash
pnpm --filter @break/api test:integration
```
Expected: all integration tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/leaderboard.ts
git commit -m "feat(api): implement leaderboard endpoint with period and limit support"
```

---

## Task 9: Frontend — useLeaderboard hook + Leaderboard page

**Files:**
- Create: `apps/web/src/features/leaderboard/useLeaderboard.ts`
- Modify: `apps/web/src/pages/Leaderboard.tsx`

- [ ] **Step 1: Create features/leaderboard directory and hook**

```bash
mkdir -p "/Users/wayanrane/Library/CloudStorage/BeeStation-TristanArshaBeeStation/42. BREAK APP/apps/web/src/features/leaderboard"
```

Create `apps/web/src/features/leaderboard/useLeaderboard.ts`:
```typescript
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export function useLeaderboard(period: LeaderboardPeriod, limit = 50) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ success: true; data: LeaderboardEntry[] }>(
        `/leaderboard?period=${period}&limit=${limit}`,
      )
      .then((res) => {
        if (!cancelled) {
          setEntries(res.data.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Gagal memuat leaderboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, limit]);

  return { entries, loading, error };
}
```

- [ ] **Step 2: Replace Leaderboard page**

Replace the full content of `apps/web/src/pages/Leaderboard.tsx`:
```typescript
import { useState } from 'react';
import { useLeaderboard, type LeaderboardPeriod } from '../features/leaderboard/useLeaderboard';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/cn';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'alltime', label: 'Semua Waktu' },
];

const RANK_BADGE: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-orange-400 text-orange-900',
};

export default function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { entries, loading, error } = useLeaderboard(period);
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              period === value
                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-gray-500 py-8">{error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🏆</p>
          <p className="text-sm text-gray-500">Belum ada data untuk periode ini.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                entry.userId === currentUserId && 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  RANK_BADGE[entry.rank] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                )}
              >
                {entry.rank}
              </div>

              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0 overflow-hidden">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {entry.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <span className="flex-1 text-sm font-medium truncate">
                {entry.username}
                {entry.userId === currentUserId && (
                  <span className="ml-1 text-xs text-brand-500">(kamu)</span>
                )}
              </span>

              <span className="text-sm font-bold text-brand-600">
                {entry.points.toLocaleString('id-ID')} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @break/web typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/leaderboard/useLeaderboard.ts apps/web/src/pages/Leaderboard.tsx
git commit -m "feat(web): implement Leaderboard page with period tabs and self-highlight"
```

---

## Task 10: Frontend — ReactionGame component + Games page

**Files:**
- Create: `apps/web/src/features/games/ReactionGame.tsx`
- Modify: `apps/web/src/pages/Games.tsx`

- [ ] **Step 1: Create features/games directory**

```bash
mkdir -p "/Users/wayanrane/Library/CloudStorage/BeeStation-TristanArshaBeeStation/42. BREAK APP/apps/web/src/features/games"
```

- [ ] **Step 2: Create ReactionGame component**

Create `apps/web/src/features/games/ReactionGame.tsx`:
```typescript
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/cn';
import api from '../../lib/api';

type GamePhase = 'idle' | 'waiting' | 'ready' | 'roundResult' | 'sessionResult' | 'submitted';

interface RoundResult {
  reactionMs: number;
  score: number;
}

interface GameScoreResponse {
  id: string;
  score: number;
  pointsEarned: number;
  playedAt: string;
}

const TOTAL_ROUNDS = 5;
const WAIT_MIN_MS = 2000;
const WAIT_MAX_MS = 6000;

function estimatePoints(avgScore: number): number {
  if (avgScore >= 800) return 5;
  if (avgScore >= 600) return 4;
  if (avgScore >= 400) return 3;
  if (avgScore >= 200) return 2;
  return 1;
}

export default function ReactionGame() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [tooEarly, setTooEarly] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<GameScoreResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const readyTimestamp = useRef<number>(0);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (waitTimer.current) clearTimeout(waitTimer.current);
    };
  }, []);

  const startRound = () => {
    setTooEarly(false);
    setLastResult(null);
    setPhase('waiting');
    const delay = WAIT_MIN_MS + Math.random() * (WAIT_MAX_MS - WAIT_MIN_MS);
    waitTimer.current = setTimeout(() => {
      readyTimestamp.current = Date.now();
      setPhase('ready');
    }, delay);
  };

  const handleAreaClick = () => {
    if (phase === 'waiting') {
      if (waitTimer.current) clearTimeout(waitTimer.current);
      setTooEarly(true);
      setPhase('roundResult');
      return;
    }
    if (phase === 'ready') {
      const reactionMs = Date.now() - readyTimestamp.current;
      const score = Math.max(0, Math.min(1000, 1000 - reactionMs));
      const result: RoundResult = { reactionMs, score };
      setLastResult(result);
      setRounds((prev) => [...prev, result]);
      setPhase('roundResult');
    }
  };

  const handleNextRound = (currentRounds: RoundResult[]) => {
    if (tooEarly) {
      startRound();
      return;
    }
    if (currentRounds.length >= TOTAL_ROUNDS) {
      setPhase('sessionResult');
    } else {
      startRound();
    }
  };

  const handleSubmit = async (avgScore: number) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const res = await api.post<{ success: true; data: GameScoreResponse }>(
        '/games/submit',
        { gameType: 'REACTION', score: avgScore },
      );
      setSubmitResult(res.data.data);
      setPhase('submitted');
    } catch {
      setSubmitError('Gagal menyimpan skor. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (waitTimer.current) clearTimeout(waitTimer.current);
    setPhase('idle');
    setRounds([]);
    setLastResult(null);
    setTooEarly(false);
    setSubmitResult(null);
    setSubmitError(null);
  };

  const avgScore = rounds.length > 0
    ? Math.round(rounds.reduce((s, r) => s + r.score, 0) / rounds.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Idle */}
      {phase === 'idle' && (
        <div className="text-center space-y-4 py-8">
          <p className="text-5xl">⚡</p>
          <div>
            <h3 className="font-bold text-lg">Reaction Time</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Klik secepat mungkin saat layar berubah hijau. {TOTAL_ROUNDS} ronde.
            </p>
          </div>
          <button
            onClick={startRound}
            className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors"
          >
            Mulai
          </button>
        </div>
      )}

      {/* Click target area — waiting or ready */}
      {(phase === 'waiting' || phase === 'ready') && (
        <>
          <div
            onClick={handleAreaClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === ' ' && handleAreaClick()}
            className={cn(
              'w-full h-64 rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-colors',
              phase === 'waiting' && 'bg-gray-200 dark:bg-gray-700',
              phase === 'ready' && 'bg-green-400 dark:bg-green-500',
            )}
          >
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
              {phase === 'waiting' ? 'Tunggu...' : 'KLIK!'}
            </p>
            {phase === 'waiting' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Jangan klik dulu</p>
            )}
          </div>
          {/* Round progress */}
          <div className="flex gap-2 justify-center">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  i < rounds.length ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700',
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Round result */}
      {phase === 'roundResult' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center space-y-3">
          {tooEarly ? (
            <>
              <p className="text-3xl">⚠️</p>
              <p className="font-bold text-lg">Terlalu cepat!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ronde ini tidak dihitung.</p>
            </>
          ) : (
            <>
              <p className="text-3xl">✅</p>
              <p className="font-bold text-2xl">{lastResult?.reactionMs} ms</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Skor: {Math.round(lastResult?.score ?? 0)} · Ronde {rounds.length}/{TOTAL_ROUNDS}
              </p>
            </>
          )}
          <button
            onClick={() => handleNextRound(rounds)}
            className="mt-2 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            {tooEarly
              ? 'Ulangi Ronde'
              : rounds.length >= TOTAL_ROUNDS
              ? 'Lihat Hasil'
              : 'Ronde Berikutnya'}
          </button>
        </div>
      )}

      {/* Session result */}
      {phase === 'sessionResult' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
          <h3 className="font-bold text-lg text-center">Hasil Sesi</h3>
          <div className="space-y-2">
            {rounds.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">Ronde {i + 1}</span>
                <span>{r.reactionMs} ms · skor {Math.round(r.score)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
            <div className="flex justify-between font-semibold text-sm">
              <span>Rata-rata skor</span>
              <span>{avgScore}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-600">
              <span>Estimasi poin</span>
              <span>+{estimatePoints(avgScore)} pts (tergantung cap harian)</span>
            </div>
          </div>
          {submitError && <p className="text-red-500 text-sm text-center">{submitError}</p>}
          <button
            onClick={() => handleSubmit(avgScore)}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Menyimpan...' : 'Kirim & Simpan'}
          </button>
        </div>
      )}

      {/* Submitted */}
      {phase === 'submitted' && submitResult && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center space-y-3">
          <p className="text-4xl">{submitResult.pointsEarned > 0 ? '🎉' : '😮'}</p>
          {submitResult.pointsEarned > 0 ? (
            <>
              <p className="font-bold text-lg">+{submitResult.pointsEarned} poin!</p>
              <p className="text-sm text-gray-500">Rata-rata skor: {avgScore}</p>
            </>
          ) : (
            <>
              <p className="font-bold">Poin harian sudah maksimal</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kamu sudah capai 20 poin dari game hari ini. Tetap bagus! Coba lagi besok.
              </p>
            </>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Main Lagi
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace Games page**

Replace the full content of `apps/web/src/pages/Games.tsx`:
```typescript
import ReactionGame from '../features/games/ReactionGame';
import { cn } from '../lib/cn';

const COMING_SOON = [
  { icon: '🖱️', title: 'Fast Clicking', description: 'Klik sebanyak mungkin dalam 10 detik' },
  { icon: '🧩', title: 'Pattern Match', description: 'Hafal dan reproduksi urutan warna' },
];

export default function Games() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mini Games</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Latih fokus dan dapatkan poin. Maks 20 poin/hari dari game.
        </p>
      </div>

      <section>
        <ReactionGame />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Segera Hadir
        </h2>
        <div className="space-y-3">
          {COMING_SOON.map(({ icon, title, description }) => (
            <div
              key={title}
              className={cn(
                'flex items-center gap-4 rounded-xl border p-4',
                'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-50',
              )}
            >
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
                Phase 2
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @break/web typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/games/ReactionGame.tsx apps/web/src/pages/Games.tsx
git commit -m "feat(web): implement ReactionGame component and Games page"
```

---

## Task 11: Frontend — useDashboard hook + Dashboard page

**Files:**
- Create: `apps/web/src/features/dashboard/useDashboard.ts`
- Modify: `apps/web/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create features/dashboard directory**

```bash
mkdir -p "/Users/wayanrane/Library/CloudStorage/BeeStation-TristanArshaBeeStation/42. BREAK APP/apps/web/src/features/dashboard"
```

- [ ] **Step 2: Create useDashboard hook**

Create `apps/web/src/features/dashboard/useDashboard.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import type { LeaderboardEntry } from '../leaderboard/useLeaderboard';

interface DashboardUser {
  id: string;
  username: string;
  totalPoints: number;
  currentStreak: number;
  avatarUrl: string | null;
}

interface TodayMission {
  id: string;
  status: 'ASSIGNED' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
}

export interface DashboardData {
  user: DashboardUser;
  todayMissions: { total: number; completed: number };
  weeklyRank: number | null;
  topLeaderboard: LeaderboardEntry[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [meRes, missionsRes, leaderboardRes] = await Promise.all([
        api.get<{ success: true; data: { user: DashboardUser } }>('/me'),
        api.get<{ success: true; data: TodayMission[] }>('/missions/today'),
        api.get<{ success: true; data: LeaderboardEntry[] }>('/leaderboard?period=weekly&limit=5'),
      ]);

      const user = meRes.data.data.user;
      const missions = missionsRes.data.data;
      const leaderboard = leaderboardRes.data.data;

      const completed = missions.filter(
        (m) => m.status === 'VERIFIED' || m.status === 'COMPLETED',
      ).length;

      const userEntry = leaderboard.find((e) => e.userId === user.id);

      setData({
        user,
        todayMissions: { total: missions.length, completed },
        weeklyRank: userEntry?.rank ?? null,
        topLeaderboard: leaderboard,
      });
      setError(null);
    } catch {
      setError('Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}
```

- [ ] **Step 3: Replace Dashboard page**

Replace the full content of `apps/web/src/pages/Dashboard.tsx`:
```typescript
import { Link } from 'react-router-dom';
import { useDashboard } from '../features/dashboard/useDashboard';
import { cn } from '../lib/cn';

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">{error ?? 'Gagal memuat data'}</p>
        <button onClick={refetch} className="text-sm text-brand-600 hover:underline mt-2">
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hei, {data.user.username} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selamat datang di BREAK</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Poin</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">
            {data.user.totalPoints.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Streak</p>
          <p className="text-2xl font-bold mt-1">
            {data.user.currentStreak}
            <span className="text-sm font-normal text-gray-500 ml-1">hari</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Misi Hari Ini</p>
          <p className="text-2xl font-bold mt-1">
            {data.todayMissions.completed}
            <span className="text-sm font-normal text-gray-500">
              /{data.todayMissions.total}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ranking Minggu Ini</p>
          <p className="text-2xl font-bold mt-1">
            {data.weeklyRank ? `#${data.weeklyRank}` : '–'}
          </p>
        </div>
      </div>

      {data.topLeaderboard.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Top 5 Minggu Ini</h2>
            <Link to="/leaderboard" className="text-sm text-brand-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="space-y-2">
            {data.topLeaderboard.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3 py-1">
                <span className="w-5 text-xs font-semibold text-gray-500">#{entry.rank}</span>
                <span className="flex-1 text-sm">{entry.username}</span>
                <span className="text-sm font-semibold text-brand-600">{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/missions"
          className={cn(
            'rounded-xl border p-4 text-center transition-colors',
            'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-400',
          )}
        >
          <p className="text-2xl mb-1">📋</p>
          <p className="text-sm font-medium">Lihat Misi</p>
        </Link>
        <Link
          to="/games"
          className={cn(
            'rounded-xl border p-4 text-center transition-colors',
            'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-400',
          )}
        >
          <p className="text-2xl mb-1">🎮</p>
          <p className="text-sm font-medium">Main Game</p>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @break/web typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/useDashboard.ts apps/web/src/pages/Dashboard.tsx
git commit -m "feat(web): implement Dashboard page with stats, mini leaderboard, and quick links"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| `pointsEarned` on GameScore | Task 1 |
| `calculateGamePoints` thresholds | Task 2 |
| `applyDailyCap` (20 pts/day) | Task 2 |
| `submitScore` — daily cap enforcement | Task 3 |
| `getMyStats` grouped by type | Task 3 |
| Game unit tests | Task 2 |
| Game integration tests | Task 4 |
| `POST /games/submit` | Task 5 |
| `GET /games/my-stats` | Task 5 |
| `getLeaderboard` — alltime (User.totalPoints) | Task 6 |
| `getLeaderboard` — weekly/monthly (Prisma groupBy merge) | Task 6 |
| Exclude zero-point users | Task 6 |
| Leaderboard integration tests | Task 7 |
| `GET /leaderboard?period&limit` | Task 8 |
| `useLeaderboard` hook | Task 9 |
| Leaderboard page — period tabs | Task 9 |
| Leaderboard page — self-highlight | Task 9 |
| Leaderboard page — top-3 gold/silver/bronze | Task 9 |
| `ReactionGame` state machine | Task 10 |
| "Terlalu cepat" round retry | Task 10 |
| Session result + submit flow | Task 10 |
| Cap message when pointsEarned = 0 | Task 10 |
| Games page with Phase 2 placeholders | Task 10 |
| `useDashboard` — 3 parallel requests | Task 11 |
| Dashboard — 4 stat cards | Task 11 |
| Dashboard — mini leaderboard top 5 | Task 11 |
| Dashboard — quick links to /missions and /games | Task 11 |

### Type consistency check

- `LeaderboardEntry` defined in `useLeaderboard.ts`, imported in `useDashboard.ts` and `Leaderboard.tsx` — consistent ✓
- `getLeaderboard` returns `LeaderboardEntry[]`, route sends `success: true, data: entries` — consistent ✓
- `submitScore` returns Prisma `GameScore` object (includes `pointsEarned` after migration) — consistent ✓
- `GameScoreResponse` in `ReactionGame.tsx` matches Prisma `GameScore` fields — consistent ✓
- `handleNextRound(rounds)` called with current `rounds` state after re-render — correct ✓
