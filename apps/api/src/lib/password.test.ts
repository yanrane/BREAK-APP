import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password';

describe('hashPassword', () => {
  it('returns a string that is not the original password', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('produces different hashes for same input', async () => {
    const hash1 = await hashPassword('secret123');
    const hash2 = await hashPassword('secret123');
    expect(hash1).not.toBe(hash2);
  });
});

describe('comparePassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('mypassword');
    const result = await comparePassword('mypassword', hash);
    expect(result).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('mypassword');
    const result = await comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });
});
