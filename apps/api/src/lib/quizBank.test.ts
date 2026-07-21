import { describe, it, expect } from 'vitest';
import { QUIZ_BANK, pickDailyQuestions, wibDateKey, QUESTIONS_PER_DAY } from './quizBank';

describe('QUIZ_BANK', () => {
  it('semua soal punya 4 opsi dan correctIndex valid', () => {
    for (const q of QUIZ_BANK) {
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });

  it('id soal unik', () => {
    const ids = QUIZ_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('pickDailyQuestions', () => {
  it('deterministik — tanggal sama menghasilkan soal sama', () => {
    const a = pickDailyQuestions('2026-07-21').map((q) => q.id);
    const b = pickDailyQuestions('2026-07-21').map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('mengambil tepat QUESTIONS_PER_DAY soal dengan topik berbeda', () => {
    const picked = pickDailyQuestions('2026-07-21');
    expect(picked).toHaveLength(QUESTIONS_PER_DAY);
    const topics = picked.map((q) => q.topic);
    expect(new Set(topics).size).toBe(QUESTIONS_PER_DAY);
  });

  it('tanggal berbeda menghasilkan pilihan berbeda (rotasi)', () => {
    const days = ['2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24'];
    const sets = days.map((d) => pickDailyQuestions(d).map((q) => q.id).join(','));
    // Minimal ada 2 hari yang beda — 4 hari identik praktis mustahil kalau rotasi jalan
    expect(new Set(sets).size).toBeGreaterThan(1);
  });
});

describe('wibDateKey', () => {
  it('format YYYY-MM-DD pada WIB', () => {
    // 2026-07-21T20:00:00Z = 2026-07-22 03:00 WIB
    expect(wibDateKey(new Date('2026-07-21T20:00:00Z'))).toBe('2026-07-22');
    expect(wibDateKey(new Date('2026-07-21T10:00:00Z'))).toBe('2026-07-21');
  });
});
