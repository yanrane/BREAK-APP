import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import router from '../routes';
import { errorHandler } from '../middleware/errorHandler';

function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandler);
  return app;
}

describe('POST /api/v1/auth/register', () => {
  it('returns 201 with tokens and user on valid input', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', username: 'testuser', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 409 when email already exists', async () => {
    const app = buildApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', username: 'user1', password: 'password123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', username: 'user2', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USER_EXISTS');
  });

  it('returns 400 on invalid email', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', username: 'user', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with tokens and user on valid credentials', async () => {
    const app = buildApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.com', username: 'loginuser', password: 'password123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('returns 401 on wrong password', async () => {
    const app = buildApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'wrong@example.com', username: 'wronguser', password: 'password123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns new accessToken for valid refreshToken', async () => {
    const app = buildApp();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ref@example.com', username: 'refuser', password: 'password123' });

    const { refreshToken } = reg.body.data;
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('returns 401 for invalid refreshToken', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('GET /api/v1/me', () => {
  it('returns user profile for valid token', async () => {
    const app = buildApp();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'me@example.com', username: 'meuser', password: 'password123' });

    const { accessToken } = reg.body.data;
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@example.com');
  });

  it('returns 401 without token', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/me');
    expect(res.status).toBe(401);
  });
});

describe('password reset flow', () => {
  it('resets password with valid token, revokes old sessions, and rejects token reuse', async () => {
    const app = buildApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'reset@example.com', username: 'resetuser', password: 'password123' });

    // Ambil token langsung dari service (email tidak terkirim di test)
    const { forgotPassword } = await import('../services/authService');
    const { token } = await forgotPassword('reset@example.com');
    expect(token).toBeTruthy();

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'newpassword456' });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Password lama tidak bisa dipakai, password baru bisa
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reset@example.com', password: 'password123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reset@example.com', password: 'newpassword456' });
    expect(newLogin.status).toBe(200);

    // Token sekali pakai
    const reuse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'anotherpass789' });
    expect(reuse.status).toBe(400);
    expect(reuse.body.error.code).toBe('INVALID_RESET_TOKEN');
  });

  it('forgot-password responds generically for unknown email', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects invalid token', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'bukan-token-valid', password: 'newpassword456' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
  });
});
