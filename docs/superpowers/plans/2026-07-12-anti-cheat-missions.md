# Misi Anti-Curang Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Misi harian tidak bisa dicurangi — timer ditegakkan jam server, bukti foto wajib dijepret live dari kamera in-app, foto duplikat ditolak global, dan misi ber-timer berjalan dalam Focus Mode fullscreen.

**Architecture:** Server-authoritative timestamps: `POST /missions/:id/start` mencatat `startedAt` (jam server, status `IN_PROGRESS`); `complete` menolak jika durasi belum lewat atau hash foto sudah pernah dipakai (unique constraint). Client (React) hanya UX: countdown terkalibrasi `serverNow`, fullscreen + pause overlay, kamera `getUserMedia` tanpa input galeri. Client tidak pernah mengirim data waktu.

**Tech Stack:** Express + Prisma (Postgres lokal / Neon prod), Multer memory storage + `file-type`, Node `crypto` (SHA-256), React 18 + Vite, Fullscreen API + `getUserMedia`. Monorepo pnpm; jalankan perintah dari root repo.

**Spec:** `docs/superpowers/specs/2026-07-12-anti-cheat-missions-design.md`

**Konteks penting untuk engineer:**
- Semua perintah dari root `42. BREAK APP/`. API dev = `pnpm --filter @break/api dev` (butuh Postgres 16: `brew services start postgresql@16`).
- ⚠️ `pnpm --filter @break/api test:integration` MENGHAPUS semua data di DB lokal `break_db` (lihat `apps/api/src/test/setup.ts`). Jangan simpan data penting di DB dev.
- Response API selalu `{ success: true, data }` / `{ success: false, error: { code, message } }` via `AppError(statusCode, code, message)` + `errorHandler`.
- Komentar & pesan error user-facing dalam Bahasa Indonesia (konvensi repo).
- Deviasi kecil dari spec (disengaja, konsisten dengan aturan kamera-live): misi yang bukti lamanya "screenshot" (call-family, meditation, stretch, learn-something) jadi `TIMER` murni — screenshot tidak mungkin dijepret kamera live.

**File structure (ringkasan):**

| File | Aksi | Tanggung jawab |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modify | enum ProofType, kolom baru Mission/UserMission, status IN_PROGRESS |
| `apps/api/prisma/seed.ts` | modify | proofType/durationMinutes per misi + misi no-phone-15min |
| `apps/api/src/lib/missionGuard.ts` (+`.test.ts`) | create | pure logic validasi complete (timer/proof/status) |
| `apps/api/src/middleware/uploadProof.ts` | modify | file jadi opsional + hitung SHA-256 → `req.proofHash` |
| `apps/api/src/types/express.d.ts` | modify | tambah `proofHash` |
| `apps/api/src/services/missionService.ts` | modify | startMission, cancelMission, completeMission baru |
| `apps/api/src/routes/missions.ts` | modify | route start/cancel, complete tanpa file wajib |
| `apps/api/src/test/missions.integration.test.ts` | modify | flow start→complete→dedup→cancel |
| `apps/web/src/features/missions/useMissions.ts` | modify | types + startMission/cancelMission, file opsional |
| `apps/web/src/features/missions/CameraCapture.tsx` | create | panel kamera live (getUserMedia → blob) |
| `apps/web/src/pages/MissionSession.tsx` | create | halaman sesi: countdown, fullscreen, pause, kamera |
| `apps/web/src/features/missions/MissionCard.tsx` | modify | tombol Start Mission → navigate ke sesi |
| `apps/web/src/pages/Missions.tsx` | modify | lepas modal upload |
| `apps/web/src/features/missions/ProofUploadModal.tsx` | delete | digantikan CameraCapture |
| `apps/web/src/App.tsx` | modify | route `/missions/:userMissionId/active` |
| `apps/web/src/pages/MissionsHistory.tsx`, `apps/web/src/features/dashboard/useDashboard.ts` | modify | label/type status IN_PROGRESS |

---

### Task 1: Schema — ProofType, durationMinutes, startedAt, proofHash, IN_PROGRESS

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Edit schema**

Di `apps/api/prisma/schema.prisma`, ubah `model Mission`, `model UserMission`, `enum MissionStatus`, dan tambah enum baru (letakkan `ProofType` dekat enum lain di bawah file):

```prisma
model Mission {
  id              String          @id @default(cuid())
  slug            String          @unique
  title           String
  description     String
  category        MissionCategory
  points          Int
  requiresProof   Boolean         @default(true)
  cooldownHours   Int             @default(24)
  isActive        Boolean         @default(true)
  proofType       ProofType       @default(PHOTO)
  durationMinutes Int?

  userMissions    UserMission[]
}

model UserMission {
  id           String        @id @default(cuid())
  userId       String
  missionId    String
  status       MissionStatus
  proofUrl     String?
  proofHash    String?       @unique
  pointsEarned Int           @default(0)
  assignedAt   DateTime      @default(now())
  startedAt    DateTime?
  completedAt  DateTime?
  verifiedAt   DateTime?

  user         User          @relation(fields: [userId], references: [id])
  mission      Mission       @relation(fields: [missionId], references: [id])

  @@index([userId, assignedAt])
}

enum MissionStatus {
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  VERIFIED
  REJECTED
}

enum ProofType {
  PHOTO
  TIMER
  PHOTO_AND_TIMER
}
```

- [ ] **Step 2: Buat migration (DB lokal harus nyala)**

Run: `cd apps/api && npx prisma migrate dev --name add_anti_cheat_missions && cd ../..`
Expected: migration baru di `apps/api/prisma/migrations/`, `prisma generate` jalan otomatis, exit 0.

- [ ] **Step 3: Typecheck seluruh repo masih hijau**

Run: `pnpm typecheck`
Expected: PASS (kolom baru semuanya optional/punya default, kode lama tetap kompatibel).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma
git commit -m "feat(api): schema misi anti-curang — ProofType, durationMinutes, startedAt, proofHash unik, status IN_PROGRESS"
```

---

### Task 2: Seed — proofType & durasi per misi + misi no-phone-15min

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Update array `missions` di seed**

Tambahkan `proofType` + `durationMinutes` ke setiap entry (dan perbarui deskripsi yang menyebut screenshot/galeri). Mapping lengkap — terapkan persis:

| slug | proofType | durationMinutes | requiresProof | deskripsi baru |
|---|---|---|---|---|
| jogging-15min | `PHOTO_AND_TIMER` | 15 | true | 'Lari atau jalan cepat di luar ruangan minimal 15 menit. Setelah timer selesai, jepret foto suasana larimu langsung dari kamera.' |
| read-20pages | `PHOTO_AND_TIMER` | 20 | true | 'Baca buku fisik (bukan e-book) minimal 20 menit. Setelah timer selesai, jepret foto halaman yang kamu baca.' |
| call-family | `TIMER` | 10 | false | 'Telepon orang tua, saudara, atau keluarga dekat minimal 10 menit selagi timer berjalan.' |
| outdoor-photo | `PHOTO` | null | true | 'Keluar rumah dan jepret foto pemandangan alam, taman, atau lingkungan sekitar langsung dari kamera.' |
| handwrite-journal | `PHOTO` | null | true | 'Tulis jurnal harian dengan tangan di atas kertas, minimal 1 halaman penuh. Jepret foto tulisanmu.' |
| meditation-10min | `TIMER` | 10 | false | 'Lakukan sesi meditasi minimal 10 menit selagi timer berjalan.' |
| cook-meal | `PHOTO` | null | true | 'Masak makanan atau minuman dari bahan baku (bukan instan). Jepret foto hasil masakanmu.' |
| meet-friend | `PHOTO` | null | true | 'Bertemu dan ngobrol tatap muka dengan minimal 1 teman. Jepret foto kalian berdua.' |
| stretch-10min | `TIMER` | 10 | false | 'Lakukan peregangan atau yoga ringan minimal 10 menit selagi timer berjalan.' |
| learn-something | `TIMER` | 20 | false | 'Pelajari keterampilan baru dari buku, kursus, atau tutorial (bukan konten hiburan) minimal 20 menit selagi timer berjalan.' |

Contoh bentuk entry setelah diubah (pola sama untuk semua):

```ts
  {
    slug: 'jogging-15min',
    title: 'Jogging minimal 15 menit',
    description: 'Lari atau jalan cepat di luar ruangan minimal 15 menit. Setelah timer selesai, jepret foto suasana larimu langsung dari kamera.',
    category: 'PHYSICAL' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 24,
    proofType: 'PHOTO_AND_TIMER' as const,
    durationMinutes: 15,
  },
```

Lalu tambahkan misi baru di akhir array:

```ts
  {
    slug: 'no-phone-15min',
    title: 'Tanpa HP 15 menit',
    description: 'Letakkan HP dan jangan sentuh selama 15 menit. Timer jalan fullscreen — keluar dari layar akan menjeda misi.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: false,
    cooldownHours: 24,
    proofType: 'TIMER' as const,
    durationMinutes: 15,
  },
```

- [ ] **Step 2: Jalankan seed**

Run: `pnpm db:seed`
Expected: log `Seeded 11 missions.` (10 lama + 1 baru), exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed proofType + durasi misi, misi baru no-phone-15min"
```

---

### Task 3: missionGuard — pure logic validasi (TDD)

**Files:**
- Create: `apps/api/src/lib/missionGuard.ts`
- Test: `apps/api/src/lib/missionGuard.test.ts`

- [ ] **Step 1: Tulis failing test**

Buat `apps/api/src/lib/missionGuard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { AppError } from './appError';
import { needsPhoto, needsTimer, remainingSeconds, assertCompletable } from './missionGuard';

const NOW = new Date('2026-07-12T10:00:00Z');

describe('needsPhoto / needsTimer', () => {
  it('PHOTO butuh foto saja', () => {
    expect(needsPhoto('PHOTO')).toBe(true);
    expect(needsTimer('PHOTO')).toBe(false);
  });
  it('TIMER butuh timer saja', () => {
    expect(needsPhoto('TIMER')).toBe(false);
    expect(needsTimer('TIMER')).toBe(true);
  });
  it('PHOTO_AND_TIMER butuh keduanya', () => {
    expect(needsPhoto('PHOTO_AND_TIMER')).toBe(true);
    expect(needsTimer('PHOTO_AND_TIMER')).toBe(true);
  });
});

describe('remainingSeconds', () => {
  it('menghitung sisa detik dari startedAt', () => {
    const startedAt = new Date(NOW.getTime() - 10 * 60 * 1000); // 10 menit lalu
    expect(remainingSeconds(startedAt, 15, NOW)).toBe(5 * 60);
  });
  it('tidak pernah negatif', () => {
    const startedAt = new Date(NOW.getTime() - 60 * 60 * 1000);
    expect(remainingSeconds(startedAt, 15, NOW)).toBe(0);
  });
});

describe('assertCompletable', () => {
  const base = {
    status: 'IN_PROGRESS' as const,
    proofType: 'PHOTO_AND_TIMER' as const,
    durationMinutes: 15,
    startedAt: new Date(NOW.getTime() - 16 * 60 * 1000),
    hasProof: true,
    now: NOW,
  };

  it('lolos saat semua syarat terpenuhi', () => {
    expect(() => assertCompletable(base)).not.toThrow();
  });

  it('MISSION_NOT_STARTED kalau status masih ASSIGNED', () => {
    expect(() => assertCompletable({ ...base, status: 'ASSIGNED' }))
      .toThrow(expect.objectContaining({ code: 'MISSION_NOT_STARTED' }));
  });

  it('MISSION_ALREADY_COMPLETED kalau sudah VERIFIED', () => {
    expect(() => assertCompletable({ ...base, status: 'VERIFIED' }))
      .toThrow(expect.objectContaining({ code: 'MISSION_ALREADY_COMPLETED' }));
  });

  it('TIMER_NOT_ELAPSED kalau durasi belum lewat', () => {
    const startedAt = new Date(NOW.getTime() - 5 * 60 * 1000);
    try {
      assertCompletable({ ...base, startedAt });
      expect.unreachable('harus throw');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('TIMER_NOT_ELAPSED');
      expect((err as AppError).message).toContain('600'); // sisa 600 detik
    }
  });

  it('PROOF_REQUIRED kalau misi berfoto tapi tidak ada file', () => {
    expect(() => assertCompletable({ ...base, hasProof: false }))
      .toThrow(expect.objectContaining({ code: 'PROOF_REQUIRED' }));
  });

  it('TIMER murni tanpa foto lolos', () => {
    expect(() => assertCompletable({ ...base, proofType: 'TIMER', hasProof: false }))
      .not.toThrow();
  });

  it('PHOTO murni tanpa startedAt timer tetap wajib start dulu', () => {
    expect(() => assertCompletable({
      ...base, proofType: 'PHOTO', durationMinutes: null, startedAt: null,
    })).toThrow(expect.objectContaining({ code: 'MISSION_NOT_STARTED' }));
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `pnpm --filter @break/api exec vitest run src/lib/missionGuard.test.ts`
Expected: FAIL — `Cannot find module './missionGuard'`.

- [ ] **Step 3: Implementasi minimal**

Buat `apps/api/src/lib/missionGuard.ts`:

```ts
import { AppError } from './appError';

export type ProofTypeValue = 'PHOTO' | 'TIMER' | 'PHOTO_AND_TIMER';
export type MissionStatusValue =
  | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';

export function needsPhoto(proofType: ProofTypeValue): boolean {
  return proofType !== 'TIMER';
}

export function needsTimer(proofType: ProofTypeValue): boolean {
  return proofType !== 'PHOTO';
}

/** Sisa detik sebelum misi boleh diselesaikan; 0 kalau sudah lewat. */
export function remainingSeconds(startedAt: Date, durationMinutes: number, now: Date): number {
  const elapsedMs = now.getTime() - startedAt.getTime();
  return Math.max(0, Math.ceil((durationMinutes * 60 * 1000 - elapsedMs) / 1000));
}

interface CompletableArgs {
  status: MissionStatusValue;
  proofType: ProofTypeValue;
  durationMinutes: number | null;
  startedAt: Date | null;
  hasProof: boolean;
  now: Date;
}

/**
 * Validasi anti-curang sebelum complete. Semua waktu dari jam server —
 * client tidak pernah dipercaya. Throw AppError kalau ada syarat yang gagal.
 */
export function assertCompletable(args: CompletableArgs): void {
  const { status, proofType, durationMinutes, startedAt, hasProof, now } = args;

  if (status === 'ASSIGNED') {
    throw new AppError(400, 'MISSION_NOT_STARTED', 'Tekan Start Mission dulu sebelum menyelesaikan misi');
  }
  if (status !== 'IN_PROGRESS') {
    throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
  }
  if (!startedAt) {
    // ponytail: IN_PROGRESS tanpa startedAt seharusnya mustahil; guard untuk data korup
    throw new AppError(400, 'MISSION_NOT_STARTED', 'Sesi misi tidak valid, mulai ulang misinya');
  }
  if (needsTimer(proofType) && durationMinutes) {
    const remaining = remainingSeconds(startedAt, durationMinutes, now);
    if (remaining > 0) {
      throw new AppError(400, 'TIMER_NOT_ELAPSED', `Timer belum selesai, sisa ${remaining} detik`);
    }
  }
  if (needsPhoto(proofType) && !hasProof) {
    throw new AppError(400, 'PROOF_REQUIRED', 'File bukti wajib diunggah');
  }
}
```

- [ ] **Step 4: Jalankan test, pastikan lolos**

Run: `pnpm --filter @break/api exec vitest run src/lib/missionGuard.test.ts`
Expected: PASS semua.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/missionGuard.ts apps/api/src/lib/missionGuard.test.ts
git commit -m "feat(api): missionGuard — validasi anti-curang timer/proof/status (pure function + test)"
```

---

### Task 4: uploadProof middleware — file opsional + SHA-256 hash

**Files:**
- Modify: `apps/api/src/middleware/uploadProof.ts`
- Modify: `apps/api/src/types/express.d.ts`

- [ ] **Step 1: Tambah `proofHash` ke type Express**

Di `apps/api/src/types/express.d.ts`, di dalam `declare global` interface Request yang sudah mendeklarasikan `proofPath`, tambahkan satu baris di sebelahnya:

```ts
      proofHash?: string;
```

- [ ] **Step 2: Ubah middleware**

Ganti isi handler kedua di `apps/api/src/middleware/uploadProof.ts`. Dua perubahan: (a) tanpa file → `next()` tanpa error (kewajiban foto sekarang divalidasi `missionGuard` di service, karena misi TIMER murni tidak butuh file); (b) hitung SHA-256 buffer sebelum simpan. Tambahkan import `createHash`:

```ts
import { createHash } from 'crypto';
```

Handler kedua menjadi:

```ts
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      // Misi TIMER murni tidak mengirim file — kewajiban foto divalidasi di missionGuard
      return next();
    }

    try {
      const detected = await fileTypeFromBuffer(req.file.buffer);
      if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
        return next(new AppError(400, 'INVALID_FILE_TYPE', 'Format file tidak valid'));
      }

      req.proofHash = createHash('sha256').update(req.file.buffer).digest('hex');

      const filename = `${crypto.randomUUID()}.${detected.ext}`;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        // Vercel Blob Storage (production)
        const { put } = await import('@vercel/blob');
        const blob = await put(`proofs/${filename}`, req.file.buffer, {
          access: 'public',
          contentType: detected.mime,
        });
        req.proofPath = blob.url;
      } else {
        // Local disk storage (development)
        const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
        await fsp.mkdir(uploadDir, { recursive: true });
        const filepath = path.join(uploadDir, filename);
        await fsp.writeFile(filepath, req.file.buffer);
        req.proofPath = `/uploads/${filename}`;
      }

      next();
    } catch (err) {
      console.error('[uploadProof] Failed to upload file:', err);
      next(new AppError(500, 'UPLOAD_FAILED', 'Gagal menyimpan file'));
    }
  },
```

(Bagian atas file — multer config, ALLOWED_MIME_TYPES — tidak berubah.)

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @break/api typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/middleware/uploadProof.ts apps/api/src/types/express.d.ts
git commit -m "feat(api): upload proof opsional + SHA-256 hash untuk dedup foto"
```

---

### Task 5: missionService — startMission, cancelMission, completeMission baru

**Files:**
- Modify: `apps/api/src/services/missionService.ts`

- [ ] **Step 1: Tambah import missionGuard**

Di atas file:

```ts
import { assertCompletable } from '../lib/missionGuard';
```

- [ ] **Step 2: Tambah startMission dan cancelMission (setelah getTodayMissions)**

```ts
/**
 * Mulai sesi misi: catat startedAt dari jam server, status IN_PROGRESS.
 * Idempoten — kalau sudah IN_PROGRESS, kembalikan sesi berjalan (resume).
 * serverNow dikirim agar client bisa kalibrasi countdown tanpa percaya jam device.
 */
export async function startMission(userId: string, userMissionId: string) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
    include: { mission: true },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }

  if (userMission.status === 'IN_PROGRESS') {
    return { userMission, serverNow: new Date().toISOString() };
  }
  if (userMission.status !== 'ASSIGNED') {
    throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
  }

  const updated = await prisma.userMission.update({
    where: { id: userMissionId, status: 'ASSIGNED' },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
    include: { mission: true },
  });
  return { userMission: updated, serverNow: new Date().toISOString() };
}

/** Batalkan sesi misi: kembali ke ASSIGNED, startedAt dihapus (bisa dicoba ulang). */
export async function cancelMission(userId: string, userMissionId: string) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }
  if (userMission.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'MISSION_NOT_IN_PROGRESS', 'Misi tidak sedang berjalan');
  }

  return prisma.userMission.update({
    where: { id: userMissionId, status: 'IN_PROGRESS' },
    data: { status: 'ASSIGNED', startedAt: null },
    include: { mission: true },
  });
}
```

- [ ] **Step 3: Rework completeMission**

Ganti fungsi `completeMission` yang ada dengan versi ini (perubahan: signature `proofPath`/`proofHash` opsional, validasi lewat `assertCompletable`, guard status update `IN_PROGRESS`, simpan `proofHash`, map P2002 → PROOF_DUPLICATE):

```ts
/**
 * Selesaikan misi (Phase 1: auto-verify) setelah lolos validasi anti-curang:
 * status IN_PROGRESS, timer server sudah lewat, foto ada + belum pernah dipakai.
 */
export async function completeMission(
  userId: string,
  userMissionId: string,
  proofPath?: string,
  proofHash?: string,
) {
  const userMission = await prisma.userMission.findUnique({
    where: { id: userMissionId },
    include: { mission: true },
  });

  if (!userMission || userMission.userId !== userId) {
    throw new AppError(404, 'MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  }

  const now = new Date();
  assertCompletable({
    status: userMission.status,
    proofType: userMission.mission.proofType,
    durationMinutes: userMission.mission.durationMinutes,
    startedAt: userMission.startedAt,
    hasProof: Boolean(proofPath && proofHash),
    now,
  });

  const rewards = await computeMissionRewards(userId, userMission.mission.points, now);

  try {
    const [updated] = await prisma.$transaction([
      prisma.userMission.update({
        where: { id: userMissionId, status: 'IN_PROGRESS' },
        data: {
          status: 'VERIFIED',
          proofUrl: proofPath ?? null,
          proofHash: proofHash ?? null,
          completedAt: now,
          verifiedAt: now,
          pointsEarned: userMission.mission.points,
        },
        include: { mission: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: rewards.userData,
      }),
      ...(rewards.petData
        ? [prisma.pet.update({ where: { userId }, data: rewards.petData })]
        : []),
    ]);
    return {
      ...updated,
      rewards: {
        expGained: rewards.expGained,
        coinsGained: rewards.coinsGained,
        eventTitle: rewards.eventTitle,
      },
    };
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === 'P2002') {
      throw new AppError(400, 'PROOF_DUPLICATE', 'Foto ini sudah pernah dipakai sebagai bukti misi');
    }
    if (prismaErr?.code === 'P2025') {
      throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
    }
    throw err;
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @break/api typecheck`
Expected: FAIL di `apps/api/src/routes/missions.ts` (masih memanggil `completeMission` dengan `req.proofPath!` 3-arg tanpa hash) — itu dikerjakan Task 6. Kalau hanya error itu, lanjut.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/missionService.ts
git commit -m "feat(api): startMission/cancelMission + completeMission dengan validasi anti-curang"
```

---

### Task 6: Routes — start, cancel, complete

**Files:**
- Modify: `apps/api/src/routes/missions.ts`

- [ ] **Step 1: Update route**

Ubah import service dan handler complete, tambah dua route baru. File lengkap setelah perubahan:

```ts
import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { promises as fsp } from 'fs';
import { requireAuth } from '../middleware/requireAuth';
import { uploadProofMiddleware } from '../middleware/uploadProof';
import {
  getTodayMissions,
  startMission,
  cancelMission,
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

// POST /api/v1/missions/:userMissionId/start — mulai sesi (startedAt = jam server)
router.post('/:userMissionId/start', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await startMission(req.user!.id, req.params.userMissionId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/cancel — batalkan sesi, kembali ke ASSIGNED
router.post('/:userMissionId/cancel', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await cancelMission(req.user!.id, req.params.userMissionId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/:userMissionId/complete — file opsional (misi TIMER murni tanpa foto)
router.post(
  '/:userMissionId/complete',
  requireAuth,
  ...uploadProofMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await completeMission(
        req.user!.id,
        req.params.userMissionId,
        req.proofPath,
        req.proofHash,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      // Bersihkan file upload lokal kalau transaksi DB gagal
      if (req.proofPath && !process.env.BLOB_READ_WRITE_TOKEN) {
        const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
        fsp.unlink(path.join(uploadDir, path.basename(req.proofPath))).catch(() => {});
      }
      next(err);
    }
  },
);

export default router;
```

- [ ] **Step 2: Typecheck + unit test**

Run: `pnpm --filter @break/api typecheck && pnpm --filter @break/api test:unit`
Expected: PASS semua (termasuk missionGuard test).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/missions.ts
git commit -m "feat(api): endpoint start/cancel misi + complete dengan file opsional"
```

---

### Task 7: Integration test — flow anti-curang end-to-end

**Files:**
- Modify: `apps/api/src/test/missions.integration.test.ts`

- [ ] **Step 1: Tambah describe block baru**

Baca dulu file existing untuk memakai helper yang sama (buildApp/register). Kalau helper-nya berbeda dari di bawah, adaptasikan — semantik test harus tetap. Tambahkan di akhir file:

```ts
describe('anti-cheat mission flow', () => {
  async function setupUserWithMission(app: express.Express, proofType: 'PHOTO' | 'TIMER' | 'PHOTO_AND_TIMER', durationMinutes: number | null) {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'anticheat@example.com', username: 'anticheat', password: 'password123' });
    const token = reg.body.data.accessToken as string;
    const userId = reg.body.data.user.id as string;

    const mission = await prisma.mission.create({
      data: {
        slug: `test-${proofType.toLowerCase()}-${Date.now()}`,
        title: 'Misi Test',
        description: 'test',
        category: 'MENTAL',
        points: 10,
        requiresProof: proofType !== 'TIMER',
        proofType,
        durationMinutes,
      },
    });
    const userMission = await prisma.userMission.create({
      data: { userId, missionId: mission.id, status: 'ASSIGNED' },
    });
    return { token, userId, userMission };
  }

  const PNG_1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

  it('menolak complete sebelum start (MISSION_NOT_STARTED)', async () => {
    const app = buildApp();
    const { token, userMission } = await setupUserWithMission(app, 'TIMER', 15);

    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSION_NOT_STARTED');
  });

  it('start mengembalikan IN_PROGRESS + serverNow, lalu menolak complete sebelum durasi lewat', async () => {
    const app = buildApp();
    const { token, userMission } = await setupUserWithMission(app, 'TIMER', 15);

    const startRes = await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.userMission.status).toBe('IN_PROGRESS');
    expect(startRes.body.data.serverNow).toBeTruthy();

    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TIMER_NOT_ELAPSED');
  });

  it('meloloskan complete setelah durasi lewat (startedAt dimundurkan via DB)', async () => {
    const app = buildApp();
    const { token, userMission } = await setupUserWithMission(app, 'TIMER', 15);

    await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    // Simulasikan 16 menit berlalu — jam server tetap sumber kebenaran
    await prisma.userMission.update({
      where: { id: userMission.id },
      data: { startedAt: new Date(Date.now() - 16 * 60 * 1000) },
    });

    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('VERIFIED');
  });

  it('menolak foto duplikat lintas misi (PROOF_DUPLICATE)', async () => {
    const app = buildApp();
    const { token, userId, userMission } = await setupUserWithMission(app, 'PHOTO', null);

    await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    const first = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proof', PNG_1x1, 'proof.png');
    expect(first.status).toBe(200);

    // Misi kedua, foto byte-identik
    const mission2 = await prisma.mission.create({
      data: {
        slug: `test-photo-dup-${Date.now()}`,
        title: 'Misi Test 2', description: 'test', category: 'MENTAL',
        points: 10, requiresProof: true, proofType: 'PHOTO', durationMinutes: null,
      },
    });
    const um2 = await prisma.userMission.create({
      data: { userId, missionId: mission2.id, status: 'ASSIGNED' },
    });
    await request(app)
      .post(`/api/v1/missions/${um2.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    const second = await request(app)
      .post(`/api/v1/missions/${um2.id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proof', PNG_1x1, 'proof.png');

    expect(second.status).toBe(400);
    expect(second.body.error.code).toBe('PROOF_DUPLICATE');
  });

  it('cancel mengembalikan ke ASSIGNED dan bisa start ulang', async () => {
    const app = buildApp();
    const { token, userMission } = await setupUserWithMission(app, 'TIMER', 15);

    await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    const cancelRes = await request(app)
      .post(`/api/v1/missions/${userMission.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('ASSIGNED');
    expect(cancelRes.body.data.startedAt).toBeNull();

    const restart = await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    expect(restart.status).toBe(200);
    expect(restart.body.data.userMission.status).toBe('IN_PROGRESS');
  });
});
```

Pastikan file test meng-import `prisma` (`import prisma from '../lib/prisma';`) — kalau belum ada, tambahkan.

- [ ] **Step 2: Jalankan integration test (⚠️ menghapus data DB lokal)**

Run: `pnpm --filter @break/api test:integration`
Expected: PASS semua, termasuk 5 test baru. Kalau test misi lama gagal karena flow baru (misal test complete langsung tanpa start), perbarui test lama: tambahkan langkah `POST .../start` (+ mundurkan `startedAt` via prisma bila misinya ber-timer) sebelum complete — jangan melonggarkan validasi barunya.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/test/missions.integration.test.ts
git commit -m "test(api): integration flow misi anti-curang (start, timer, dedup, cancel)"
```

---

### Task 8: Web — types & hook useMissions

**Files:**
- Modify: `apps/web/src/features/missions/useMissions.ts`
- Modify: `apps/web/src/features/dashboard/useDashboard.ts:15`
- Modify: `apps/web/src/pages/MissionsHistory.tsx:6-20`

- [ ] **Step 1: Update types + hook**

Di `apps/web/src/features/missions/useMissions.ts`:

Interface `Mission` — tambah:

```ts
  proofType: 'PHOTO' | 'TIMER' | 'PHOTO_AND_TIMER';
  durationMinutes: number | null;
```

Interface `UserMission` — ubah `status` dan tambah `startedAt`:

```ts
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  startedAt: string | null;
```

Di dalam `useTodayMissions`, ganti `completeMission` lama dan tambah dua fungsi (file sekarang opsional):

```ts
  const startMission = async (userMissionId: string) => {
    const res = await api.post<{ success: true; data: { userMission: UserMission; serverNow: string } }>(
      `/missions/${userMissionId}/start`,
    );
    const { userMission, serverNow } = res.data.data;
    setMissions((prev) => prev.map((m) => (m.id === userMissionId ? userMission : m)));
    return { userMission, serverNow };
  };

  const cancelMission = async (userMissionId: string) => {
    const res = await api.post<{ success: true; data: UserMission }>(
      `/missions/${userMissionId}/cancel`,
    );
    setMissions((prev) => prev.map((m) => (m.id === userMissionId ? res.data.data : m)));
    return res.data.data;
  };

  const completeMission = async (userMissionId: string, proofFile?: File): Promise<UserMission> => {
    let res;
    if (proofFile) {
      const formData = new FormData();
      formData.append('proof', proofFile);
      res = await api.post<{ success: true; data: UserMission }>(
        `/missions/${userMissionId}/complete`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
    } else {
      res = await api.post<{ success: true; data: UserMission }>(
        `/missions/${userMissionId}/complete`,
      );
    }
    setMissions((prev) =>
      prev.map((m) => (m.id === userMissionId ? res.data.data : m)),
    );
    return res.data.data;
  };
```

Return hook menjadi:

```ts
  return { missions, loading, error, startMission, cancelMission, completeMission, refetch: fetchMissions };
```

- [ ] **Step 2: Status IN_PROGRESS di konsumen lain**

- `apps/web/src/features/dashboard/useDashboard.ts:15` — samakan union status: `'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED'`.
- `apps/web/src/pages/MissionsHistory.tsx` — tambahkan entry ke kedua map:
  - `STATUS_LABEL`: `IN_PROGRESS: 'Berlangsung',`
  - `STATUS_STYLE`: `IN_PROGRESS: 'border-ink bg-cream',`

- [ ] **Step 3: Typecheck web**

Run: `pnpm --filter @break/web typecheck`
Expected: FAIL hanya di `Missions.tsx` (masih memanggil `completeMission` pola lama) — diperbaiki Task 10. Kalau ada error lain, bereskan dulu.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/missions/useMissions.ts apps/web/src/features/dashboard/useDashboard.ts apps/web/src/pages/MissionsHistory.tsx
git commit -m "feat(web): types + hook start/cancel misi, status IN_PROGRESS"
```

---

### Task 9: Web — CameraCapture component

**Files:**
- Create: `apps/web/src/features/missions/CameraCapture.tsx`

- [ ] **Step 1: Buat komponen**

```tsx
import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  isSubmitting: boolean;
  onCapture: (file: File) => void;
}

/**
 * Panel kamera live — bukti misi WAJIB dijepret di sini, tidak ada input galeri
 * (aturan anti-curang: foto lama/orang lain tidak bisa dipakai).
 */
export default function CameraCapture({ isSubmitting, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (previewBlob) return; // kamera mati selama preview

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError(true));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [previewBlob]);

  useEffect(() => {
    if (!previewBlob) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewBlob]);

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) setPreviewBlob(blob); }, 'image/jpeg', 0.85);
  };

  const handleSubmit = () => {
    if (!previewBlob) return;
    onCapture(new File([previewBlob], 'proof.jpg', { type: 'image/jpeg' }));
  };

  if (cameraError) {
    return (
      <div className="border-2 border-coral p-6 text-center">
        <p className="text-3xl mb-3">📵</p>
        <p className="font-extrabold mb-1">Kamera tidak tersedia</p>
        <p className="text-sm text-muted font-medium">
          Misi ini butuh foto langsung dari kamera. Buka BREAK di HP kamu, lalu izinkan akses kamera.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Preview bukti" className="w-full border-2 border-ink" />
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewBlob(null)}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink bg-cream shadow-hard-sm"
            >
              ↺ Ulangi
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Mengirim…' : 'Kirim Bukti →'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* playsInline wajib supaya iOS Safari tidak memaksa fullscreen video */}
          <video ref={videoRef} autoPlay playsInline muted className="w-full border-2 border-ink bg-ink" />
          <button
            onClick={handleSnap}
            className="w-full py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm"
          >
            📸 Jepret
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @break/web typecheck`
Expected: tidak ada error baru dari file ini (error Missions.tsx dari Task 8 masih boleh ada).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/missions/CameraCapture.tsx
git commit -m "feat(web): CameraCapture — bukti foto wajib jepret live, tanpa input galeri"
```

---

### Task 10: Web — halaman MissionSession + wiring card/routes

**Files:**
- Create: `apps/web/src/pages/MissionSession.tsx`
- Modify: `apps/web/src/features/missions/MissionCard.tsx`
- Modify: `apps/web/src/pages/Missions.tsx`
- Modify: `apps/web/src/App.tsx`
- Delete: `apps/web/src/features/missions/ProofUploadModal.tsx`

- [ ] **Step 1: Buat halaman sesi**

`apps/web/src/pages/MissionSession.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTodayMissions } from '../features/missions/useMissions';
import CameraCapture from '../features/missions/CameraCapture';

type Phase = 'ready' | 'countdown' | 'capture' | 'done';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MissionSession() {
  const { userMissionId } = useParams<{ userMissionId: string }>();
  const navigate = useNavigate();
  const { missions, loading, startMission, cancelMission, completeMission } = useTodayMissions();

  const containerRef = useRef<HTMLDivElement>(null);
  // endAtMs dihitung dari startedAt + serverNow (jam server) — jam device hanya untuk delta tampilan
  const endAtRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const userMission = missions.find((m) => m.id === userMissionId);
  const mission = userMission?.mission;
  const hasTimer = mission ? mission.proofType !== 'PHOTO' : false;
  const hasPhoto = mission ? mission.proofType !== 'TIMER' : false;

  // Countdown tick (display only — server yang memvalidasi waktu sebenarnya)
  useEffect(() => {
    if (phase !== 'countdown' || paused) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil(((endAtRef.current ?? 0) - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setPhase(hasPhoto ? 'capture' : 'done');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, paused, hasPhoto]);

  // Focus Mode: keluar fullscreen / pindah tab = pause
  useEffect(() => {
    if (phase !== 'countdown') return;
    const onLeave = () => {
      if (document.hidden || !document.fullscreenElement) setPaused(true);
    };
    document.addEventListener('visibilitychange', onLeave);
    document.addEventListener('fullscreenchange', onLeave);
    return () => {
      document.removeEventListener('visibilitychange', onLeave);
      document.removeEventListener('fullscreenchange', onLeave);
    };
  }, [phase]);

  // Anti-exit ringan selama sesi berjalan
  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'capture') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [phase]);

  const enterFullscreen = useCallback(async () => {
    // Fullscreen bisa ditolak browser (iOS Safari) — sesi tetap jalan, pause tetap aktif via visibilitychange
    try { await containerRef.current?.requestFullscreen(); } catch { /* noop */ }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const handleStart = async () => {
    if (!userMissionId || !mission) return;
    try {
      setSubmitError(null);
      const { userMission: um, serverNow } = await startMission(userMissionId);
      if (hasTimer && mission.durationMinutes && um.startedAt) {
        const elapsedMs = new Date(serverNow).getTime() - new Date(um.startedAt).getTime();
        endAtRef.current = Date.now() + mission.durationMinutes * 60 * 1000 - elapsedMs;
        await enterFullscreen();
        setPaused(false);
        setPhase('countdown');
      } else {
        setPhase('capture');
      }
    } catch {
      setSubmitError('Gagal memulai misi. Coba lagi.');
    }
  };

  const handleCancel = async () => {
    if (!userMissionId) return;
    exitFullscreen();
    try { await cancelMission(userMissionId); } catch { /* status di server mungkin sudah berubah */ }
    navigate('/missions');
  };

  const handleComplete = async (file?: File) => {
    if (!userMissionId) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await completeMission(userMissionId, file);
      exitFullscreen();
      navigate('/missions');
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })
        ?.response?.data?.error?.code;
      if (code === 'TIMER_NOT_ELAPSED') {
        // Jam server bilang belum selesai — kembali ke countdown (jangan percaya jam device)
        setSubmitError('Timer server belum selesai — tunggu sebentar lagi.');
        setPhase('countdown');
      } else if (code === 'PROOF_DUPLICATE') {
        setSubmitError('Foto ini sudah pernah dipakai. Jepret foto baru ya.');
      } else {
        setSubmitError('Gagal menyelesaikan misi. Coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-60 border-2 border-ink/20 bg-cream-2 animate-pulse" />;

  if (!userMission || !mission) {
    return (
      <div className="border-2 border-ink p-10 shadow-hard text-center">
        <p className="font-extrabold text-lg mb-2">Misi tidak ditemukan</p>
        <button onClick={() => navigate('/missions')} className="text-sm font-extrabold underline decoration-lime decoration-2">
          ← Kembali ke Misi Harian
        </button>
      </div>
    );
  }

  if (userMission.status === 'VERIFIED' || userMission.status === 'COMPLETED') {
    return (
      <div className="border-2 border-ink p-10 shadow-hard text-center bg-lime">
        <p className="text-4xl mb-3">✓</p>
        <p className="font-extrabold text-lg mb-2">Misi sudah selesai!</p>
        <button onClick={() => navigate('/missions')} className="text-sm font-extrabold underline decoration-2">
          ← Kembali ke Misi Harian
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-xl bg-cream min-h-full p-1">
      <div className="border-b-2 border-ink pb-4 mb-6">
        <p className="text-label mb-1">Sesi Misi</p>
        <h1 className="text-3xl font-extrabold leading-tight">{mission.title}</h1>
        <p className="text-sm text-muted font-medium mt-1">{mission.description}</p>
      </div>

      {phase === 'ready' && (
        <div className="text-center space-y-4">
          {hasTimer && (
            <p className="text-6xl font-extrabold">{formatTime((mission.durationMinutes ?? 0) * 60)}</p>
          )}
          <button
            onClick={handleStart}
            className="w-full py-4 text-lg font-extrabold border-2 border-ink bg-ink text-cream shadow-hard"
          >
            ▶ Mulai Misi
          </button>
          {hasTimer && (
            <p className="text-xs text-muted font-semibold">
              Misi berjalan fullscreen. Keluar dari layar = timer dijeda.
            </p>
          )}
        </div>
      )}

      {phase === 'countdown' && !paused && (
        <div className="text-center space-y-6">
          <p className="text-7xl font-extrabold tabular-nums">{formatTime(remaining)}</p>
          <p className="text-sm text-muted font-semibold">Tetap fokus — jangan tinggalkan layar ini.</p>
          <button onClick={handleCancel} className="text-xs font-extrabold underline decoration-coral decoration-2 text-muted">
            Batalkan misi
          </button>
        </div>
      )}

      {phase === 'countdown' && paused && (
        <div className="border-2 border-coral p-8 text-center space-y-4 shadow-hard-coral">
          <p className="text-3xl">⏸</p>
          <p className="font-extrabold text-lg">Misi dijeda</p>
          <p className="text-sm text-muted font-medium">Kamu keluar dari mode fokus. Lanjutkan atau batalkan?</p>
          <div className="flex gap-3">
            <button
              onClick={async () => { await enterFullscreen(); setPaused(false); }}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm"
            >
              Lanjutkan
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-coral text-coral"
            >
              Batalkan misi
            </button>
          </div>
        </div>
      )}

      {phase === 'capture' && (
        <div className="space-y-3">
          <p className="text-label">Bukti Misi — jepret langsung dari kamera</p>
          <CameraCapture isSubmitting={isSubmitting} onCapture={(file) => handleComplete(file)} />
        </div>
      )}

      {phase === 'done' && (
        <button
          onClick={() => handleComplete()}
          disabled={isSubmitting}
          className="w-full py-4 text-lg font-extrabold border-2 border-ink bg-lime shadow-hard disabled:opacity-50"
        >
          {isSubmitting ? 'Mengirim…' : '✓ Selesaikan Misi'}
        </button>
      )}

      {submitError && (
        <div className="border-2 border-coral px-4 py-2 mt-4">
          <p className="text-coral text-sm font-semibold">{submitError}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: MissionCard — tombol Start**

Di `apps/web/src/features/missions/MissionCard.tsx`:
- Ubah interface props: ganti `onComplete: (userMissionId: string) => void;` menjadi `onStart: (userMissionId: string) => void;` dan destructure `onStart`.
- Update kondisi status: `const isVerified = status === 'VERIFIED';` tetap; tambah `const isInProgress = status === 'IN_PROGRESS';`.
- Ganti blok tombol paling bawah (`{!isCompleted && (...)}`)  dengan:

```tsx
        {!isCompleted && (
          <button
            onClick={() => onStart(userMission.id)}
            className="w-full py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-100"
          >
            {isInProgress ? 'Lanjutkan Sesi →' : '▶ Start Mission'}
          </button>
        )}
```

- [ ] **Step 3: Missions.tsx — lepas modal, navigate ke sesi**

Ganti isi `apps/web/src/pages/Missions.tsx`: hapus import & render `ProofUploadModal`, hapus state `selectedMissionId`/`submitError`/`isSubmitting` + `handleComplete`/`handleModalClose`/`handleProofSubmit`, tambah `useNavigate`. Bagian yang berubah:

```tsx
import { Link, useNavigate } from 'react-router-dom';
```

Di dalam komponen:

```tsx
  const navigate = useNavigate();
  const { missions, loading, error, refetch } = useTodayMissions();
```

Dan pemakaian card:

```tsx
            <MissionCard
              key={um.id}
              userMission={um}
              apiBaseUrl={API_BASE}
              onStart={(id) => navigate(`/missions/${id}/active`)}
            />
```

Sisanya (header, loading, error, empty state) tidak berubah.

- [ ] **Step 4: Route + hapus modal**

Di `apps/web/src/App.tsx` tambahkan di dalam `<Route element={<Layout />}>` setelah baris `/missions/history`:

```tsx
          <Route path="/missions/:userMissionId/active" element={<MissionSession />} />
```

dengan import `import MissionSession from './pages/MissionSession';`.

Hapus file modal lama:

```bash
git rm apps/web/src/features/missions/ProofUploadModal.tsx
```

- [ ] **Step 5: Typecheck + build**

Run: `pnpm --filter @break/web typecheck && pnpm --filter @break/web build`
Expected: PASS keduanya, tanpa referensi tersisa ke ProofUploadModal (`grep -rn "ProofUploadModal" apps/web/src` harus kosong).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "feat(web): halaman sesi misi — timer terkalibrasi server, focus mode fullscreen, kamera live"
```

---

### Task 11: Verifikasi penuh + update docs state

**Files:**
- Modify: `current-state.md`, `tasks.md`, `known-issues.md` (root repo)

- [ ] **Step 1: Semua test + typecheck + build**

Run: `pnpm typecheck && pnpm --filter @break/api test:unit && pnpm --filter @break/api test:integration && pnpm --filter @break/web build`
Expected: PASS semua. (⚠️ integration wipe DB lokal.)

- [ ] **Step 2: Smoke test manual di browser (dev)**

Jalankan Postgres + API (`pnpm --filter @break/api dev`) + web (`pnpm --filter @break/web dev`), login akun test, lalu verifikasi via preview browser:
1. Kartu misi menampilkan "▶ Start Mission" → klik → halaman sesi.
2. Misi ber-timer: "Mulai Misi" → fullscreen + countdown jalan.
3. Pindah tab → overlay "Misi dijeda" muncul; "Lanjutkan" kembali fullscreen; "Batalkan" kembali ke /missions dan kartu balik ke Start.
4. Curang via devtools: panggil `complete` sebelum timer habis → error `TIMER_NOT_ELAPSED`.
5. Misi PHOTO: kamera terbuka (bukan file picker), jepret → kirim → kartu jadi SELESAI.
6. Submit foto byte-sama ke misi lain → pesan "Foto ini sudah pernah dipakai".

- [ ] **Step 3: Update docs state**

Perbarui `current-state.md` (fitur anti-curang live di dev), `tasks.md` (tandai done, sisa backlog AI Companion: Daily Reflection, Brain Games, animasi, Anti-Exit penuh), `known-issues.md` (tambah: fullscreen tidak didukung iOS Safari → pause hanya via visibilitychange; kamera butuh HTTPS/localhost).

- [ ] **Step 4: Commit**

```bash
git add current-state.md tasks.md known-issues.md
git commit -m "docs: state update — misi anti-curang selesai di dev"
```

---

### Task 12: Deploy production (⚠️ BUTUH KONFIRMASI Boss Wayan/Tristan dulu)

**Jangan jalankan tanpa konfirmasi eksplisit — ini mengubah DB & app production.**

- [ ] **Step 1: Migrasi Neon**

```bash
cd apps/api && vercel env pull .env.production.local
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
```

(ambil `DIRECT_URL` dari file env hasil pull). Expected: `add_anti_cheat_missions` applied.

- [ ] **Step 2: Seed prod (update misi + no-phone-15min)**

Jalankan seed terhadap DATABASE_URL prod (pola sama seperti deploy 5 Jul). Expected: `Seeded 11 missions.`

- [ ] **Step 3: Deploy API lalu web**

```bash
cd apps/api && vercel --prod
cd ../web && vercel --prod
vercel alias set <deploy-url-web> break-id.vercel.app   # alias TIDAK pindah otomatis
```

- [ ] **Step 4: Smoke test prod**

Ulangi checklist Task 11 Step 2 poin 1-3 & 5 di `https://break-id.vercel.app` via HP (kamera butuh HTTPS — di prod aman).

---

## Self-review notes (sudah dijalankan)

- **Spec coverage:** schema (T1), seed+misi baru (T2), validasi server (T3, T5), start/cancel (T5-T6), dedup hash (T4-T5, T7), kamera live tanpa galeri (T9), countdown server-calibrated + focus mode + pause Lanjutkan/Batalkan + beforeunload (T10), testing (T3, T7, T11), rollout (T12). Known limitations spec tidak butuh task (dokumentasi).
- **Konsistensi nama:** `startMission`/`cancelMission`/`completeMission(userId, id, proofPath?, proofHash?)`, `req.proofHash`, error codes `MISSION_NOT_STARTED`/`TIMER_NOT_ELAPSED`/`PROOF_REQUIRED`/`PROOF_DUPLICATE`/`MISSION_NOT_IN_PROGRESS` — dipakai seragam di T3-T10.
- **Catatan sadar:** `useTodayMissions()` di MissionSession fetch ulang `/missions/today` (bukan share state dengan halaman Missions) — sederhana dan cukup; jangan "dioptimalkan" ke global store.
