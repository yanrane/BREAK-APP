import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';

describe('signAccessToken', () => {
  it('returns a non-empty string', () => {
    const token = signAccessToken('user-123');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});

describe('verifyAccessToken', () => {
  it('returns payload with userId for valid token', () => {
    const token = signAccessToken('user-123');
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe('user-123');
  });

  it('throws for invalid token', () => {
    expect(() => verifyAccessToken('bad-token')).toThrow();
  });

  it('throws for refresh token used as access token', () => {
    const refresh = signRefreshToken('user-123');
    expect(() => verifyAccessToken(refresh)).toThrow();
  });
});

describe('signRefreshToken', () => {
  it('returns a non-empty string', () => {
    const token = signRefreshToken('user-123');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});

describe('verifyRefreshToken', () => {
  it('returns payload with userId for valid token', () => {
    const token = signRefreshToken('user-123');
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe('user-123');
  });

  it('throws for invalid token', () => {
    expect(() => verifyRefreshToken('bad-token')).toThrow();
  });
});
