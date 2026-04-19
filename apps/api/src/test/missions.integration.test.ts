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
  it('marks mission as VERIFIED and awards points', async () => {
    await assignMissionsForUser(userId);
    const userMissions = await prisma.userMission.findMany({ where: { userId } });
    const userMissionId = userMissions[0].id;
    const missionPoints = (await prisma.mission.findUnique({ where: { id: userMissions[0].missionId } }))!.points;

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
    await assignMissionsForUser(userId);
    const userMission = (await prisma.userMission.findFirst({ where: { userId } }))!;

    // Complete once
    await request(app)
      .post(`/api/v1/missions/${userMission.id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('proof', MINIMAL_JPEG, { filename: 'proof.jpg', contentType: 'image/jpeg' });

    // Try again — should fail
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
