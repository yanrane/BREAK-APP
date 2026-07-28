import { describe, it, expect } from 'vitest';
import { parsePhotoCheck, checkProofPhoto } from './photoCheck';

describe('parsePhotoCheck', () => {
  it('membaca jawaban yang valid', () => {
    expect(parsePhotoCheck('{"match":true,"score":88,"reason":"Terlihat halaman buku."}')).toEqual({
      match: true,
      score: 88,
      reason: 'Terlihat halaman buku.',
    });
  });

  it('menjepit score ke rentang 0-100 dan membulatkannya', () => {
    expect(parsePhotoCheck('{"match":false,"score":-20,"reason":"x"}')?.score).toBe(0);
    expect(parsePhotoCheck('{"match":true,"score":250,"reason":"x"}')?.score).toBe(100);
    expect(parsePhotoCheck('{"match":true,"score":72.6,"reason":"x"}')?.score).toBe(73);
  });

  it('memotong reason yang kepanjangan', () => {
    const long = JSON.stringify({ match: true, score: 50, reason: 'a'.repeat(900) });
    expect(parsePhotoCheck(long)?.reason).toHaveLength(500);
  });

  it('return null untuk jawaban yang tidak bisa dipakai', () => {
    expect(parsePhotoCheck('bukan json')).toBeNull();
    expect(parsePhotoCheck('{"score":80,"reason":"x"}')).toBeNull(); // match hilang
    expect(parsePhotoCheck('{"match":true,"reason":"x"}')).toBeNull(); // score hilang
    expect(parsePhotoCheck('{"match":"ya","score":80,"reason":"x"}')).toBeNull(); // tipe salah
  });
});

describe('checkProofPhoto', () => {
  it('melewati pemeriksaan saat ANTHROPIC_API_KEY kosong', async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const result = await checkProofPhoto({
        buffer: Buffer.from('x'),
        mime: 'image/png',
        missionTitle: 'Baca buku',
        missionDescription: 'Baca 20 halaman',
      });
      expect(result).toBeNull(); // null = tidak diperiksa, bukan tidak sesuai
    } finally {
      if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
    }
  });
});
