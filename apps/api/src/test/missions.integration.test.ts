import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { rm } from 'fs/promises';
import app from '../index';
import prisma from '../lib/prisma';
import { assignMissionsForUser } from '../jobs/assignDailyMissions';

// Minimal JFIF JPEG — recognized by file-type@16 magic bytes check
const MINIMAL_JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from([0x00, 0x10]),
  Buffer.from([0x4a, 0x46, 0x49, 0x46, 0x00]),
  Buffer.from([0x01, 0x01, 0x00]),
  Buffer.from([0x00, 0x01, 0x00, 0x01]),
  Buffer.from([0x00, 0x00]),
  Buffer.from([0xff, 0xd9]),
]);

let accessToken: string;
let userId: string;

beforeAll(async () => {
  // Ensure at least 3 test missions exist
  await prisma.mission.upsert({
    where: { slug: 'test-physical' },
    update: {},
    create: { slug: 'test-physical', title: 'Test Physical', description: 'desc', category: 'PHYSICAL', points: 10, cooldownHours: 24 },
  });
  await prisma.mission.upsert({
    where: { slug: 'test-mental' },
    update: {},
    create: { slug: 'test-mental', title: 'Test Mental', description: 'desc', category: 'MENTAL', points: 15, cooldownHours: 24 },
  });
  await prisma.mission.upsert({
    where: { slug: 'test-social' },
    update: {},
    create: { slug: 'test-social', title: 'Test Social', description: 'desc', category: 'SOCIAL', points: 20, cooldownHours: 24 },
  });
});

beforeEach(async () => {
  // Clean up user-specific data between tests
  const users = await prisma.user.findMany({ where: { email: { endsWith: '@missions-test.com' } } });
  for (const user of users) {
    await prisma.userMission.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  }
  await prisma.user.deleteMany({ where: { email: { endsWith: '@missions-test.com' } } });

  // Register a fresh test user
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'user@missions-test.com', username: 'missionstest1', password: 'password123' });

  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Test setup failed — registration returned ${res.status}: ${JSON.stringify(res.body)}`);
  }

  accessToken = res.body.data.accessToken;
  userId = res.body.data.user.id;
});

afterAll(async () => {
  // Clean up test-uploaded files
  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  try {
    await rm(uploadDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors in test environment
  }
  await prisma.$disconnect();
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

  it('returns assigned missions after assignMissionsForUser runs', async () => {
    await assignMissionsForUser(userId);

    const res = await request(app)
      .get('/api/v1/missions/today')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('mission');
    expect(res.body.data[0].status).toBe('ASSIGNED');
  });

  it('does not double-assign when called twice', async () => {
    await assignMissionsForUser(userId);
    await assignMissionsForUser(userId);

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
  /**
   * Buat UserMission ASSIGNED langsung ke misi 'test-physical' (proofType PHOTO,
   * durationMinutes null dari beforeAll di atas) — bypass assignMissionsForUser.
   * Pool assignMissionsForUser juga berisi misi seed asli (TIMER/PHOTO_AND_TIMER,
   * lihat prisma/seed.ts) yang bisa terpilih secara acak dan butuh timer, jadi
   * tidak aman mengandalkan random assignment untuk skenario "langsung lolos foto".
   */
  async function createPhotoUserMission(uid: string) {
    const mission = await prisma.mission.findUniqueOrThrow({ where: { slug: 'test-physical' } });
    return prisma.userMission.create({
      data: { userId: uid, missionId: mission.id, status: 'ASSIGNED' },
      include: { mission: true },
    });
  }

  it('marks mission as VERIFIED and awards points', async () => {
    const userMission = await createPhotoUserMission(userId);
    const userMissionId = userMission.id;
    const missionPoints = userMission.mission.points;

    await request(app)
      .post(`/api/v1/missions/${userMissionId}/start`)
      .set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app)
      .post(`/api/v1/missions/${userMissionId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('VERIFIED');
    expect(res.body.data.proofUrl).toMatch(/^\/uploads\/.+\.jpe?g$/);
    expect(res.body.data.pointsEarned).toBe(missionPoints);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.totalPoints).toBe(missionPoints);
  });

  it('returns 409 if mission already completed', async () => {
    const userMission = await createPhotoUserMission(userId);

    // Start, then complete once
    await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${accessToken}`);
    await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    // Try again — should fail (already VERIFIED)
    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('MISSION_ALREADY_COMPLETED');
  });

  it('returns 400 if no proof file attached', async () => {
    const userMission = await createPhotoUserMission(userId);

    await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${accessToken}`);

    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PROOF_REQUIRED');
  });

  it('returns 404 for mission belonging to another user', async () => {
    // Create a second user
    const otherRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'other@missions-test.com', username: 'missionstest2', password: 'password123' });
    const otherId = otherRes.body.data.user.id;
    await assignMissionsForUser(otherId);
    const otherMission = (await prisma.userMission.findFirst({ where: { userId: otherId } }))!;

    const res = await request(app)
      .post(`/api/v1/missions/${otherMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('MISSION_NOT_FOUND');
  });
});

describe('GET /api/v1/missions/history', () => {
  it('returns paginated mission history', async () => {
    await assignMissionsForUser(userId);

    const res = await request(app)
      .get('/api/v1/missions/history?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      limit: 10,
    });
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/missions/history');
    expect(res.status).toBe(401);
  });
});

describe('anti-cheat mission flow', () => {
  let seq = 0;

  /**
   * Register user baru + buat 1 Mission & UserMission ASSIGNED langsung lewat Prisma
   * (bypass cron assignDailyMissions) supaya proofType/durationMinutes bisa dikontrol per test.
   */
  async function setupUserWithMission(
    proofType: 'PHOTO' | 'TIMER' | 'PHOTO_AND_TIMER',
    durationMinutes: number | null,
  ) {
    seq += 1;
    const email = `anticheat${seq}@missions-test.com`;
    const username = `anticheat${seq}`;

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, username, password: 'password123' });

    const token = reg.body.data.accessToken as string;
    const uId = reg.body.data.user.id as string;

    const mission = await prisma.mission.create({
      data: {
        slug: `test-${proofType.toLowerCase()}-${Date.now()}-${seq}`,
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
      data: { userId: uId, missionId: mission.id, status: 'ASSIGNED' },
    });
    return { token, userId: uId, userMission };
  }

  const PNG_1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

  it('menolak complete sebelum start (MISSION_NOT_STARTED)', async () => {
    const { token, userMission } = await setupUserWithMission('TIMER', 15);

    const res = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSION_NOT_STARTED');
  });

  it('start mengembalikan IN_PROGRESS + serverNow, lalu menolak complete sebelum durasi lewat', async () => {
    const { token, userMission } = await setupUserWithMission('TIMER', 15);

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
    const { token, userMission } = await setupUserWithMission('TIMER', 15);

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
    const { token, userId: uId, userMission } = await setupUserWithMission('PHOTO', null);

    await request(app)
      .post(`/api/v1/missions/${userMission.id}/start`)
      .set('Authorization', `Bearer ${token}`);
    const first = await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proof', PNG_1x1, 'proof.png');
    expect(first.status).toBe(200);

    // Misi kedua, foto byte-identik
    seq += 1;
    const mission2 = await prisma.mission.create({
      data: {
        slug: `test-photo-dup-${Date.now()}-${seq}`,
        title: 'Misi Test 2',
        description: 'test',
        category: 'MENTAL',
        points: 10,
        requiresProof: true,
        proofType: 'PHOTO',
        durationMinutes: null,
      },
    });
    const um2 = await prisma.userMission.create({
      data: { userId: uId, missionId: mission2.id, status: 'ASSIGNED' },
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
    const { token, userMission } = await setupUserWithMission('TIMER', 15);

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
