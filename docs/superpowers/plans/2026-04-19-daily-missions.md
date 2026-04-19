# Daily Missions Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full Daily Missions feature — seed data, cron assignment, proof upload endpoints, and frontend UI with upload modal.

**Architecture:** Backend: seed 10 missions, cron assigns 3/day per user (1 PHYSICAL + 1 MENTAL + 1 SOCIAL/CREATIVE), proof upload uses multer memoryStorage + file-type magic bytes validation + UUID rename + auto-verify (Phase 1). Frontend: custom hook + card components + upload modal + history page.

**Tech Stack:** node-cron (cron job), multer (upload), file-type@16 (CJS-compatible magic bytes), uuid (file rename), React Hook Form + FormData (frontend upload), plain Tailwind (no shadcn/ui — not yet installed in web).

---

## File Map

**New files — backend:**
- `apps/api/prisma/seed.ts` — 10 mission seeds
- `apps/api/src/lib/missionSelector.ts` — pure category-aware selection function
- `apps/api/src/lib/missionSelector.test.ts` — unit tests (TDD)
- `apps/api/src/lib/dateUtils.ts` — `getWIBStartOfDay()` timezone utility
- `apps/api/src/jobs/assignDailyMissions.ts` — cron + exportable `assignMissionsForUser()`
- `apps/api/src/middleware/uploadProof.ts` — multer memoryStorage + magic bytes + file write
- `apps/api/src/services/missionService.ts` — `getTodayMissions`, `completeMission`, `getMissionHistory`
- `apps/api/src/test/missions.integration.test.ts` — integration tests

**Modified files — backend:**
- `apps/api/src/routes/missions.ts` — replace 501 stubs with real handlers
- `apps/api/src/index.ts` — mount cron, serve `/uploads` static

**New files — frontend:**
- `apps/web/src/features/missions/useMissions.ts` — data fetching hook
- `apps/web/src/features/missions/MissionCard.tsx` — single mission card
- `apps/web/src/features/missions/ProofUploadModal.tsx` — file upload modal
- `apps/web/src/pages/MissionsHistory.tsx` — paginated history page

**Modified files — frontend:**
- `apps/web/src/pages/Missions.tsx` — replace stub with real page
- `apps/web/src/App.tsx` — add `/missions/history` route

---

## Task 1: Install dependencies

**Files:**
- Modify: `apps/api/package.json` (via pnpm add)

- [ ] **Step 1: Install backend packages**

Run:
```bash
pnpm --filter @break/api add multer @types/multer uuid @types/uuid node-cron @types/node-cron "file-type@^16.5.4"
```
Expected: packages added to `apps/api/package.json` dependencies.

- [ ] **Step 2: Verify typecheck still passes**

Run:
```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): install multer, uuid, node-cron, file-type for missions feature"
```

---

## Task 2: Seed 10 missions

**Files:**
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Create seed file**

Create `apps/api/prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const missions = [
  {
    slug: 'jogging-15min',
    title: 'Jogging minimal 15 menit',
    description: 'Lari atau jalan cepat di luar ruangan minimal 15 menit. Upload foto sepatu/route/GPS tracker sebagai bukti.',
    category: 'PHYSICAL' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'read-20pages',
    title: 'Baca buku fisik 20 halaman',
    description: 'Baca buku fisik (bukan e-book) minimal 20 halaman. Upload foto halaman terakhir yang kamu baca.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'call-family',
    title: 'Telepon anggota keluarga 10 menit',
    description: 'Telepon orang tua, saudara, atau keluarga dekat minimal 10 menit. Upload screenshot durasi panggilan.',
    category: 'SOCIAL' as const,
    points: 10,
    requiresProof: true,
    cooldownHours: 48,
  },
  {
    slug: 'outdoor-photo',
    title: 'Foto pemandangan di luar rumah',
    description: 'Keluar rumah dan ambil foto pemandangan alam, taman, atau lingkungan sekitar.',
    category: 'PHYSICAL' as const,
    points: 10,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'handwrite-journal',
    title: 'Tulis jurnal tangan 1 halaman',
    description: 'Tulis jurnal harian dengan tangan di atas kertas, minimal 1 halaman penuh. Upload foto tulisanmu.',
    category: 'CREATIVE' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'meditation-10min',
    title: 'Meditasi 10 menit',
    description: 'Lakukan sesi meditasi minimal 10 menit menggunakan timer atau app meditasi. Upload screenshot timer.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'cook-meal',
    title: 'Masak 1 menu sendiri',
    description: 'Masak makanan atau minuman dari bahan baku (bukan instan). Upload foto hasil masakanmu.',
    category: 'CREATIVE' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 48,
  },
  {
    slug: 'meet-friend',
    title: 'Ngobrol langsung dengan teman',
    description: 'Bertemu dan ngobrol tatap muka dengan minimal 1 teman selama 30 menit. Upload foto kalian.',
    category: 'SOCIAL' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'stretch-10min',
    title: 'Peregangan 10 menit',
    description: 'Lakukan peregangan atau yoga ringan minimal 10 menit. Upload foto atau screenshot timer.',
    category: 'PHYSICAL' as const,
    points: 10,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'learn-something',
    title: 'Pelajari hal baru 20 menit',
    description: 'Pelajari keterampilan baru dari buku, kursus, atau tutorial (bukan konten hiburan) minimal 20 menit.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
  },
];

async function main() {
  console.log('Seeding missions...');
  for (const mission of missions) {
    await prisma.mission.upsert({
      where: { slug: mission.slug },
      update: mission,
      create: mission,
    });
  }
  console.log(`Seeded ${missions.length} missions.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run seed**

```bash
pnpm --filter @break/api db:seed
```
Expected: "Seeded 10 missions." (requires running PostgreSQL with break_db).

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "chore(api): add seed script with 10 missions from CLAUDE.md spec"
```

---

## Task 3: missionSelector utility (TDD)

**Files:**
- Create: `apps/api/src/lib/missionSelector.test.ts`
- Create: `apps/api/src/lib/missionSelector.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/lib/missionSelector.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { selectDailyMissions } from './missionSelector';

const mission = (id: string, category: 'PHYSICAL' | 'MENTAL' | 'SOCIAL' | 'CREATIVE') => ({ id, category });

describe('selectDailyMissions', () => {
  it('returns exactly 3 missions from a full pool', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('p2', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('m2', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    expect(result).toHaveLength(3);
  });

  it('includes 1 PHYSICAL mission when available', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
    ];
    const result = selectDailyMissions(pool);
    const categories = result.map(m => m.category);
    expect(categories).toContain('PHYSICAL');
  });

  it('includes 1 MENTAL mission when available', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
    ];
    const result = selectDailyMissions(pool);
    const categories = result.map(m => m.category);
    expect(categories).toContain('MENTAL');
  });

  it('fills 3rd slot with SOCIAL or CREATIVE', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    const categories = result.map(m => m.category);
    const hasSocialOrCreative = categories.includes('SOCIAL') || categories.includes('CREATIVE');
    expect(hasSocialOrCreative).toBe(true);
  });

  it('returns no duplicate mission IDs', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    const ids = result.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back to any category if PHYSICAL pool is empty', () => {
    const pool = [
      mission('m1', 'MENTAL'),
      mission('m2', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    expect(result).toHaveLength(3);
    const ids = result.map(m => m.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('returns all available missions when pool has fewer than 3', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
    ];
    const result = selectDailyMissions(pool);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty pool', () => {
    expect(selectDailyMissions([])).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @break/api test:unit -- src/lib/missionSelector.test.ts
```
Expected: FAIL — "Cannot find module './missionSelector'"

- [ ] **Step 3: Implement missionSelector**

Create `apps/api/src/lib/missionSelector.ts`:
```typescript
export interface MissionPool {
  id: string;
  category: 'PHYSICAL' | 'MENTAL' | 'SOCIAL' | 'CREATIVE';
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function selectDailyMissions(pool: MissionPool[]): MissionPool[] {
  if (pool.length === 0) return [];

  const physical = shuffle(pool.filter((m) => m.category === 'PHYSICAL'));
  const mental = shuffle(pool.filter((m) => m.category === 'MENTAL'));
  const socialCreative = shuffle(
    pool.filter((m) => m.category === 'SOCIAL' || m.category === 'CREATIVE'),
  );

  const selected: MissionPool[] = [];
  const selectedIds = new Set<string>();

  const pickFrom = (bucket: MissionPool[]) => {
    const m = bucket.find((item) => !selectedIds.has(item.id));
    if (m) {
      selected.push(m);
      selectedIds.add(m.id);
    }
  };

  pickFrom(physical);
  pickFrom(mental);
  pickFrom(socialCreative);

  // Fill remaining slots from any unselected mission
  if (selected.length < 3) {
    for (const m of shuffle(pool.filter((item) => !selectedIds.has(item.id)))) {
      if (selected.length >= 3) break;
      selected.push(m);
      selectedIds.add(m.id);
    }
  }

  return selected;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm --filter @break/api test:unit -- src/lib/missionSelector.test.ts
```
Expected: 7 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/missionSelector.ts apps/api/src/lib/missionSelector.test.ts
git commit -m "feat(api): add missionSelector utility with category-aware random selection"
```

---

## Task 4: Date utility + uploadProof middleware

**Files:**
- Create: `apps/api/src/lib/dateUtils.ts`
- Create: `apps/api/src/middleware/uploadProof.ts`

- [ ] **Step 1: Create dateUtils**

Create `apps/api/src/lib/dateUtils.ts`:
```typescript
// Returns UTC Date representing midnight of the current day in WIB (UTC+7)
export function getWIBStartOfDay(): Date {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const now = new Date();
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  wibNow.setUTCHours(0, 0, 0, 0);
  return new Date(wibNow.getTime() - WIB_OFFSET_MS);
}
```

- [ ] **Step 2: Create uploadProof middleware**

Create `apps/api/src/middleware/uploadProof.ts`:
```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/appError';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = (parseInt(process.env.MAX_UPLOAD_MB ?? '5', 10)) * 1024 * 1024;

// Use memory storage so we can validate magic bytes before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Hanya JPG, PNG, dan WEBP yang diizinkan'));
    } else {
      cb(null, true);
    }
  },
});

// Attach multer as first step, then validate magic bytes, then write to disk
export const uploadProofMiddleware = [
  upload.single('proof'),
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      return next(new AppError(400, 'PROOF_REQUIRED', 'File bukti wajib diunggah'));
    }

    try {
      const detected = await fileTypeFromBuffer(req.file.buffer);
      if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
        return next(new AppError(400, 'INVALID_FILE_TYPE', 'Format file tidak valid'));
      }

      const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${uuidv4()}.${detected.ext}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);

      // Attach the saved path to req for use in the route handler
      (req as Request & { proofPath: string }).proofPath = `/uploads/${filename}`;
      next();
    } catch {
      next(new AppError(500, 'UPLOAD_FAILED', 'Gagal menyimpan file'));
    }
  },
];
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/lib/dateUtils.ts apps/api/src/middleware/uploadProof.ts
git commit -m "feat(api): add dateUtils and uploadProof middleware with magic bytes validation"
```

---

## Task 5: missionService

**Files:**
- Create: `apps/api/src/services/missionService.ts`

- [ ] **Step 1: Create missionService**

Create `apps/api/src/services/missionService.ts`:
```typescript
import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { getWIBStartOfDay } from '../lib/dateUtils';

export async function getTodayMissions(userId: string) {
  const todayStart = getWIBStartOfDay();
  return prisma.userMission.findMany({
    where: {
      userId,
      assignedAt: { gte: todayStart },
    },
    include: { mission: true },
    orderBy: { assignedAt: 'asc' },
  });
}

export async function completeMission(
  userId: string,
  userMissionId: string,
  proofPath: string,
) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
    include: { mission: true },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }

  if (userMission.status !== 'ASSIGNED') {
    throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
  }

  const now = new Date();
  const [updated] = await prisma.$transaction([
    prisma.userMission.update({
      where: { id: userMissionId },
      data: {
        status: 'VERIFIED',
        proofUrl: proofPath,
        completedAt: now,
        verifiedAt: now,
        pointsEarned: userMission.mission.points,
      },
      include: { mission: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: userMission.mission.points } },
    }),
  ]);

  return updated;
}

export async function getMissionHistory(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.userMission.findMany({
      where: { userId },
      include: { mission: true },
      orderBy: { assignedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userMission.count({ where: { userId } }),
  ]);

  return { items, total, page, limit };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/missionService.ts
git commit -m "feat(api): add missionService with getTodayMissions, completeMission, getMissionHistory"
```

---

## Task 6: assignDailyMissions cron job

**Files:**
- Create: `apps/api/src/jobs/assignDailyMissions.ts`

- [ ] **Step 1: Create jobs directory and cron file**

Run:
```bash
mkdir -p "/Users/wayanrane/Library/CloudStorage/BeeStation-TristanArshaBeeStation/42. BREAK APP/apps/api/src/jobs"
```

Create `apps/api/src/jobs/assignDailyMissions.ts`:
```typescript
import cron from 'node-cron';
import prisma from '../lib/prisma';
import { selectDailyMissions } from '../lib/missionSelector';
import { getWIBStartOfDay } from '../lib/dateUtils';

// Exported for use in integration tests
export async function assignMissionsForUser(userId: string): Promise<void> {
  const todayStart = getWIBStartOfDay();

  // Skip if user already has missions assigned today
  const existingCount = await prisma.userMission.count({
    where: { userId, assignedAt: { gte: todayStart } },
  });
  if (existingCount > 0) return;

  // Find missions completed recently (within max cooldown of 48h)
  const recentCompletions = await prisma.userMission.findMany({
    where: {
      userId,
      status: { in: ['COMPLETED', 'VERIFIED'] },
      completedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    include: { mission: { select: { id: true, cooldownHours: true } } },
  });

  const inCooldownIds = new Set<string>();
  for (const um of recentCompletions) {
    if (!um.completedAt) continue;
    const elapsedHours = (Date.now() - um.completedAt.getTime()) / (1000 * 60 * 60);
    if (elapsedHours < um.mission.cooldownHours) {
      inCooldownIds.add(um.missionId);
    }
  }

  const availableMissions = await prisma.mission.findMany({
    where: {
      isActive: true,
      id: { notIn: [...inCooldownIds] },
    },
    select: { id: true, category: true },
  });

  const selected = selectDailyMissions(availableMissions);
  if (selected.length === 0) return;

  await prisma.userMission.createMany({
    data: selected.map((m) => ({
      userId,
      missionId: m.id,
      status: 'ASSIGNED',
    })),
  });
}

export function startDailyMissionsCron(): void {
  // Runs at 00:00 every day in WIB (Asia/Jakarta = UTC+7)
  cron.schedule(
    '0 0 * * *',
    async () => {
      console.log('[cron] Assigning daily missions...');
      try {
        const users = await prisma.user.findMany({ select: { id: true } });
        await Promise.all(users.map((u) => assignMissionsForUser(u.id)));
        console.log(`[cron] Assigned missions for ${users.length} users`);
      } catch (err) {
        console.error('[cron] assignDailyMissions error:', err);
      }
    },
    { timezone: 'Asia/Jakarta' },
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/jobs/assignDailyMissions.ts
git commit -m "feat(api): add assignDailyMissions cron job with cooldown-aware selection"
```

---

## Task 7: Replace mission route stubs + wire index.ts

**Files:**
- Modify: `apps/api/src/routes/missions.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Replace mission route stubs**

Replace the full content of `apps/api/src/routes/missions.ts`:
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { uploadProofMiddleware } from '../middleware/uploadProof';
import {
  getTodayMissions,
  completeMission,
  getMissionHistory,
} from '../services/missionService';

const router: Router = Router();

// GET /api/v1/missions/today
router.get('/today', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const missions = await getTodayMissions(req.user!.id);
    res.json({ success: true, data: missions });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/missions/history?page=1&limit=20
router.get('/history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const result = await getMissionHistory(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/complete
router.post(
  '/:userMissionId/complete',
  requireAuth,
  ...uploadProofMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proofPath = (req as Request & { proofPath: string }).proofPath;
      const updated = await completeMission(
        req.user!.id,
        req.params.userMissionId,
        proofPath,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
```

- [ ] **Step 2: Update index.ts to start cron and serve /uploads**

Replace the full content of `apps/api/src/index.ts`:
```typescript
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { startDailyMissionsCron } from './jobs/assignDailyMissions';

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Serve uploaded proof images
const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
app.use('/uploads', express.static(uploadDir));

app.use('/api/v1', router);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  startDailyMissionsCron();
});

export default app;
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @break/api typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/missions.ts apps/api/src/index.ts
git commit -m "feat(api): implement missions endpoints and wire cron + static upload serving"
```

---

## Task 8: Integration tests for missions

**Files:**
- Create: `apps/api/src/test/missions.integration.test.ts`

- [ ] **Step 1: Create integration test file**

Create `apps/api/src/test/missions.integration.test.ts`:
```typescript
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import app from '../index';
import prisma from '../lib/prisma';
import { assignMissionsForUser } from '../jobs/assignDailyMissions';

// Minimal 1x1 JPEG magic bytes (JFIF header)
const MINIMAL_JPEG = Buffer.from(
  'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707' +
  '07090909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c' +
  '231c1c2837292c30313434341f27393d38323c2e333432ffffc000' +
  '0b080001000101011100ffc4001f0000010501010101010100000000000000' +
  '000102030405060708090a0bffda00080101000003f0007fffd9',
  'hex',
);

let accessToken: string;
let userId: string;

beforeAll(async () => {
  // Seed missions if none exist
  const count = await prisma.mission.count();
  if (count === 0) {
    await prisma.mission.createMany({
      data: [
        { slug: 'test-physical', title: 'Test Physical', description: 'desc', category: 'PHYSICAL', points: 10, cooldownHours: 24 },
        { slug: 'test-mental', title: 'Test Mental', description: 'desc', category: 'MENTAL', points: 10, cooldownHours: 24 },
        { slug: 'test-social', title: 'Test Social', description: 'desc', category: 'SOCIAL', points: 10, cooldownHours: 24 },
      ],
    });
  }
});

beforeEach(async () => {
  await prisma.userMission.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mission.deleteMany();

  // Re-create test missions
  await prisma.mission.createMany({
    data: [
      { slug: 'test-physical', title: 'Test Physical', description: 'desc', category: 'PHYSICAL', points: 10, cooldownHours: 24 },
      { slug: 'test-mental', title: 'Test Mental', description: 'desc', category: 'MENTAL', points: 10, cooldownHours: 24 },
      { slug: 'test-social', title: 'Test Social', description: 'desc', category: 'SOCIAL', points: 10, cooldownHours: 24 },
    ],
  });

  // Register a test user
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'mission@test.com', username: 'missiontest', password: 'password123' });

  accessToken = registerRes.body.data.accessToken;
  userId = registerRes.body.data.user.id;
});

describe('GET /api/v1/missions/today', () => {
  it('returns empty array when no missions assigned', async () => {
    const res = await request(app)
      .get('/api/v1/missions/today')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns assigned missions after cron runs', async () => {
    await assignMissionsForUser(userId);

    const res = await request(app)
      .get('/api/v1/missions/today')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('mission');
    expect(res.body.data[0].status).toBe('ASSIGNED');
  });

  it('does not assign missions twice for the same user today', async () => {
    await assignMissionsForUser(userId);
    await assignMissionsForUser(userId); // second call should be no-op

    const res = await request(app)
      .get('/api/v1/missions/today')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body.data.length).toBeLessThanOrEqual(3);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/missions/today');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/missions/:id/complete', () => {
  it('marks mission as VERIFIED and adds points', async () => {
    await assignMissionsForUser(userId);
    const todayMissions = await prisma.userMission.findMany({ where: { userId } });
    const userMissionId = todayMissions[0].id;
    const missionPoints = (await prisma.mission.findUnique({
      where: { id: todayMissions[0].missionId },
    }))!.points;

    const res = await request(app)
      .post(`/api/v1/missions/${userMissionId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('VERIFIED');
    expect(res.body.data.proofUrl).toMatch(/^\/uploads\/.+\.jpg$/);
    expect(res.body.data.pointsEarned).toBe(missionPoints);

    // User's totalPoints should be updated
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.totalPoints).toBe(missionPoints);
  });

  it('returns 409 if mission already completed', async () => {
    await assignMissionsForUser(userId);
    const userMission = (await prisma.userMission.findFirst({ where: { userId } }))!;

    // Complete once
    await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    // Try to complete again
    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('MISSION_ALREADY_COMPLETED');
  });

  it('returns 400 if no proof file attached', async () => {
    await assignMissionsForUser(userId);
    const userMission = (await prisma.userMission.findFirst({ where: { userId } }))!;

    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PROOF_REQUIRED');
  });

  it('returns 404 for mission belonging to another user', async () => {
    // Create another user and assign missions to them
    const otherRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'other@test.com', username: 'otheruser', password: 'password123' });
    const otherId = otherRes.body.data.user.id;
    await assignMissionsForUser(otherId);
    const otherMission = (await prisma.userMission.findFirst({ where: { userId: otherId } }))!;

    // Try to complete other user's mission with first user's token
    const res = await request(app)
      .post(`/api/v1/missions/${otherMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/missions/history', () => {
  it('returns paginated mission history', async () => {
    await assignMissionsForUser(userId);

    const res = await request(app)
      .get('/api/v1/missions/history?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page', 1);
    expect(res.body.data).toHaveProperty('limit', 10);
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
pnpm --filter @break/api test:integration -- src/test/missions.integration.test.ts
```
Expected: all tests pass (requires running PostgreSQL + test DB).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/test/missions.integration.test.ts
git commit -m "test(api): add integration tests for missions endpoints"
```

---

## Task 9: Frontend — useMissions hook + MissionCard + ProofUploadModal

**Files:**
- Create: `apps/web/src/features/missions/useMissions.ts`
- Create: `apps/web/src/features/missions/MissionCard.tsx`
- Create: `apps/web/src/features/missions/ProofUploadModal.tsx`

- [ ] **Step 1: Create features/missions directory**

```bash
mkdir -p "/Users/wayanrane/Library/CloudStorage/BeeStation-TristanArshaBeeStation/42. BREAK APP/apps/web/src/features/missions"
```

- [ ] **Step 2: Create useMissions hook**

Create `apps/web/src/features/missions/useMissions.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

export interface Mission {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'PHYSICAL' | 'MENTAL' | 'SOCIAL' | 'CREATIVE';
  points: number;
  requiresProof: boolean;
}

export interface UserMission {
  id: string;
  missionId: string;
  status: 'ASSIGNED' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  proofUrl: string | null;
  pointsEarned: number;
  assignedAt: string;
  completedAt: string | null;
  mission: Mission;
}

export interface MissionHistoryResult {
  items: UserMission[];
  total: number;
  page: number;
  limit: number;
}

export function useTodayMissions() {
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: true; data: UserMission[] }>('/missions/today');
      setMissions(res.data.data);
      setError(null);
    } catch {
      setError('Gagal memuat misi hari ini');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const completeMission = async (userMissionId: string, proofFile: File): Promise<UserMission> => {
    const formData = new FormData();
    formData.append('proof', proofFile);
    const res = await api.post<{ success: true; data: UserMission }>(
      `/missions/${userMissionId}/complete`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    // Optimistic update
    setMissions((prev) =>
      prev.map((m) => (m.id === userMissionId ? res.data.data : m)),
    );
    return res.data.data;
  };

  return { missions, loading, error, completeMission, refetch: fetchMissions };
}

export function useMissionHistory(page: number, limit = 20) {
  const [result, setResult] = useState<MissionHistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ success: true; data: MissionHistoryResult }>(
        `/missions/history?page=${page}&limit=${limit}`,
      )
      .then((res) => {
        if (!cancelled) {
          setResult(res.data.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Gagal memuat riwayat misi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, limit]);

  return { result, loading, error };
}
```

- [ ] **Step 3: Create MissionCard component**

Create `apps/web/src/features/missions/MissionCard.tsx`:
```typescript
import { cn } from '../../lib/cn';
import type { UserMission } from './useMissions';

const CATEGORY_ICON: Record<string, string> = {
  PHYSICAL: '🏃',
  MENTAL: '🧠',
  SOCIAL: '🤝',
  CREATIVE: '🎨',
};

const CATEGORY_LABEL: Record<string, string> = {
  PHYSICAL: 'Fisik',
  MENTAL: 'Mental',
  SOCIAL: 'Sosial',
  CREATIVE: 'Kreatif',
};

interface MissionCardProps {
  userMission: UserMission;
  apiBaseUrl?: string;
  onComplete: (userMissionId: string) => void;
}

export default function MissionCard({ userMission, apiBaseUrl = '', onComplete }: MissionCardProps) {
  const { mission, status, proofUrl } = userMission;
  const isVerified = status === 'VERIFIED';
  const isCompleted = status === 'COMPLETED' || isVerified;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 space-y-3 transition-colors',
        'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
        isVerified && 'border-green-400 dark:border-green-600',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            {CATEGORY_ICON[mission.category]}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {CATEGORY_LABEL[mission.category]}
          </span>
        </div>
        <span className="text-sm font-semibold text-brand-600">+{mission.points} pts</span>
      </div>

      <div>
        <h3 className="font-semibold text-sm">{mission.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mission.description}</p>
      </div>

      {isVerified && proofUrl && (
        <div className="space-y-2">
          <img
            src={`${apiBaseUrl}${proofUrl}`}
            alt="Bukti misi"
            className="w-full h-32 object-cover rounded-lg"
          />
          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <span>✓</span>
            <span>Misi selesai · +{userMission.pointsEarned} poin</span>
          </div>
        </div>
      )}

      {!isCompleted && (
        <button
          onClick={() => onComplete(userMission.id)}
          className={cn(
            'w-full py-2 rounded-lg text-sm font-medium text-white transition-colors',
            'bg-brand-600 hover:bg-brand-700',
          )}
        >
          Selesaikan
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create ProofUploadModal**

Create `apps/web/src/features/missions/ProofUploadModal.tsx`:
```typescript
import { useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface ProofUploadModalProps {
  isOpen: boolean;
  missionTitle: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

export default function ProofUploadModal({
  isOpen,
  missionTitle,
  isSubmitting,
  onClose,
  onSubmit,
}: ProofUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Hanya JPG, PNG, dan WEBP yang diizinkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 5MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    onSubmit(selectedFile);
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Upload Bukti</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{missionTitle}</p>

        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
            'border-gray-300 dark:border-gray-600 hover:border-brand-500',
            preview && 'p-0 border-solid',
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <div className="py-6 space-y-2">
              <p className="text-3xl">📷</p>
              <p className="text-sm text-gray-500">Klik untuk pilih foto</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP · Maks 5MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {fileError && (
          <p className="text-red-500 text-xs">{fileError}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors',
              'bg-brand-600 hover:bg-brand-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isSubmitting ? 'Mengunggah...' : 'Kirim Bukti'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @break/web typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/missions/
git commit -m "feat(web): add useMissions hook, MissionCard, and ProofUploadModal components"
```

---

## Task 10: Frontend — Missions page + MissionsHistory page + routing

**Files:**
- Modify: `apps/web/src/pages/Missions.tsx`
- Create: `apps/web/src/pages/MissionsHistory.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Replace Missions page stub**

Replace the full content of `apps/web/src/pages/Missions.tsx`:
```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTodayMissions } from '../features/missions/useMissions';
import MissionCard from '../features/missions/MissionCard';
import ProofUploadModal from '../features/missions/ProofUploadModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? '';

export default function Missions() {
  const { missions, loading, error, completeMission, refetch } = useTodayMissions();
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedUserMission = missions.find((m) => m.id === selectedMissionId);

  const handleComplete = (userMissionId: string) => {
    setSelectedMissionId(userMissionId);
    setSubmitError(null);
  };

  const handleModalClose = () => {
    setSelectedMissionId(null);
    setSubmitError(null);
  };

  const handleProofSubmit = async (file: File) => {
    if (!selectedMissionId) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await completeMission(selectedMissionId, file);
      setSelectedMissionId(null);
    } catch {
      setSubmitError('Gagal mengirim bukti. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Misi Hari Ini</h1>
        <Link
          to="/missions/history"
          className="text-sm text-brand-600 hover:underline"
        >
          Riwayat
        </Link>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-8 space-y-3">
          <p className="text-gray-500">{error}</p>
          <button
            onClick={refetch}
            className="text-sm text-brand-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && missions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">
            Misi hari ini belum tersedia. Cek lagi besok pagi!
          </p>
        </div>
      )}

      {!loading && !error && missions.length > 0 && (
        <div className="space-y-4">
          {missions.map((um) => (
            <MissionCard
              key={um.id}
              userMission={um}
              apiBaseUrl={API_BASE}
              onComplete={handleComplete}
            />
          ))}
          <p className="text-center text-xs text-gray-400 mt-6">
            Misi direset setiap pukul 00:00 WIB
          </p>
        </div>
      )}

      {submitError && (
        <p className="text-red-500 text-sm text-center mt-4">{submitError}</p>
      )}

      <ProofUploadModal
        isOpen={!!selectedMissionId}
        missionTitle={selectedUserMission?.mission.title ?? ''}
        isSubmitting={isSubmitting}
        onClose={handleModalClose}
        onSubmit={handleProofSubmit}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create MissionsHistory page**

Create `apps/web/src/pages/MissionsHistory.tsx`:
```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMissionHistory } from '../features/missions/useMissions';
import { cn } from '../lib/cn';

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Belum selesai',
  COMPLETED: 'Menunggu verifikasi',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
};

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED: 'text-gray-500',
  COMPLETED: 'text-yellow-600',
  VERIFIED: 'text-green-600',
  REJECTED: 'text-red-500',
};

const LIMIT = 20;

export default function MissionsHistory() {
  const [page, setPage] = useState(1);
  const { result, loading, error } = useMissionHistory(page, LIMIT);

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/missions" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-2xl font-bold">Riwayat Misi</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-gray-500 py-8">{error}</p>
      )}

      {!loading && !error && result && result.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📜</p>
          <p className="text-gray-500 text-sm">Belum ada riwayat misi.</p>
          <Link to="/missions" className="text-sm text-brand-600 hover:underline mt-2 inline-block">
            Lihat misi hari ini
          </Link>
        </div>
      )}

      {!loading && !error && result && result.items.length > 0 && (
        <>
          <div className="space-y-3">
            {result.items.map((um) => (
              <div
                key={um.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{um.mission.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(um.assignedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-xs font-medium', STATUS_COLOR[um.status])}>
                      {STATUS_LABEL[um.status]}
                    </p>
                    {um.pointsEarned > 0 && (
                      <p className="text-xs text-brand-600 font-semibold">
                        +{um.pointsEarned} pts
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              >
                ← Sebelumnya
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              >
                Berikutnya →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add /missions/history route to App.tsx**

Edit `apps/web/src/App.tsx` — replace the import section and add the new route:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Missions from './pages/Missions';
import MissionsHistory from './pages/MissionsHistory';
import Leaderboard from './pages/Leaderboard';
import Games from './pages/Games';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/missions/history" element={<MissionsHistory />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/games" element={<Games />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
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
git add apps/web/src/pages/Missions.tsx apps/web/src/pages/MissionsHistory.tsx apps/web/src/App.tsx
git commit -m "feat(web): implement Missions page with upload modal and MissionsHistory page"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| Seed 10 missions | Task 2 |
| Cron 00:00 WIB | Task 6 |
| 1 PHYSICAL + 1 MENTAL + 1 SOCIAL/CREATIVE rule | Task 3 (missionSelector) |
| Cooldown skip | Task 6 (assignMissionsForUser) |
| GET /missions/today | Task 7 |
| POST /missions/:id/complete (multipart) | Task 7 |
| file-type magic bytes validation | Task 4 |
| UUID rename | Task 4 |
| Auto-verify (Phase 1) | Task 5 (completeMission) |
| Points increment | Task 5 |
| GET /missions/history paginated | Task 7 |
| Unit test missionSelector | Task 3 |
| Integration test full flow | Task 8 |
| Frontend /missions with cards + upload modal | Task 10 |
| Frontend /missions/history paginated | Task 10 |
| Loading skeleton + empty state | Task 10 |
| Optimistic UI update after submit | Task 9 (useMissions) |
| Proof thumbnail on verified missions | Task 9 (MissionCard) |

No moderation panel (Phase 2) — correctly excluded.

### Potential issues
- `file-type@16.5.4` must be the installed version; `@17+` is ESM-only and will break CJS imports. The install command in Task 1 pins to `^16.5.4`.
- `assignMissionsForUser` is exported for testability without starting the cron scheduler.
- The minimal JPEG buffer in integration tests is hex-encoded — verify the hex is a valid JPEG magic bytes sequence (`FF D8 FF`).
- The `/uploads` static serve in `index.ts` uses `path.resolve` which requires the uploads directory to exist; it will be created lazily by `uploadProof.ts` on first upload.
