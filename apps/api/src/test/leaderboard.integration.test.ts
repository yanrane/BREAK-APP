import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

let tokenA: string;
let tokenB: string;
let userAId: string;

beforeEach(async () => {
  // Explicit cleanup — global setup.ts cleanup is not reliable within a test file
  const existing = await prisma.user.findMany({ where: { email: { endsWith: '@leaderboard-test.com' } } });
  for (const u of existing) {
    await prisma.gameScore.deleteMany({ where: { userId: u.id } });
    await prisma.userMission.deleteMany({ where: { userId: u.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
  }
  await prisma.user.deleteMany({ where: { email: { endsWith: '@leaderboard-test.com' } } });

  const resA = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'leader_a@leaderboard-test.com', username: 'leadera', password: 'password123' });
  if (resA.status !== 201) throw new Error(`Setup failed: ${resA.status} ${JSON.stringify(resA.body)}`);
  tokenA = resA.body.data.accessToken;
  userAId = resA.body.data.user.id;

  const resB = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'leader_b@leaderboard-test.com', username: 'leaderb', password: 'password123' });
  if (resB.status !== 201) throw new Error(`Setup failed: ${resB.status} ${JSON.stringify(resB.body)}`);
  tokenB = resB.body.data.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
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

  it('alltime — reads User.totalPoints directly, no game/mission rows needed', async () => {
    // Seed totalPoints directly — no GameScore or UserMission rows
    await prisma.user.update({ where: { id: userAId }, data: { totalPoints: 100 } });

    const res = await request(app)
      .get('/api/v1/leaderboard?period=alltime')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toMatchObject({ userId: userAId, points: 100, rank: 1 });
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
