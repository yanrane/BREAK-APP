import { describe, it, expect } from 'vitest';
import { AVATARS, avatarDataUri, unlockedAvatars } from './avatars';

describe('avatars', () => {
  it('level naik monoton dan id unik', () => {
    const levels = AVATARS.map((a) => a.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(new Set(AVATARS.map((a) => a.id)).size).toBe(AVATARS.length);
  });

  it('membuka avatar sesuai level pet', () => {
    expect(unlockedAvatars(1).map((a) => a.id)).toEqual(['chick']);
    expect(unlockedAvatars(4).map((a) => a.id)).toEqual(['chick']);
    expect(unlockedAvatars(5).map((a) => a.id)).toEqual(['chick', 'fox']);
    expect(unlockedAvatars(30).map((a) => a.id)).toContain('dragon');
    expect(unlockedAvatars(30).map((a) => a.id)).not.toContain('lion');
    expect(unlockedAvatars(999)).toHaveLength(AVATARS.length);
  });

  it('data-URI valid dan memuat emoji', () => {
    const uri = avatarDataUri('🦊');
    expect(uri.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(uri)).toContain('🦊');
    expect(uri).not.toContain('<'); // ter-encode, aman dipakai sebagai src
  });
});
