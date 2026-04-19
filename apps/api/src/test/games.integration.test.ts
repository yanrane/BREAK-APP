import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

let accessToken: string;
let userId: string;

beforeEach(async () => {
  const existing = await prisma.user.findMany({ where: { email: { endsWith: '@game-test.com' } } });
  for (const u of existing) {
    await prisma.gameScore.deleteMany({ where: { userId: u.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
  }
  await prisma.user.deleteMany({ where: { email: { endsWith: '@game-test.com' } } });

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'game@game-test.com', username: 'gametest', password: 'password123' });

  if (res.status !== 201) {
    throw new Error(`Test setup failed — registration returned ${res.status}: ${JSON.stringify(res.body)}`);
  }

  accessToken = res.body.data.accessToken;
  userId = res.body.data.user.id;
});

afterAll(async () => {
  await prisma.$disconnect();
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
