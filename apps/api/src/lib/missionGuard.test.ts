import { describe, it, expect } from 'vitest';
import { AppError } from './appError';
import { needsPhoto, needsTimer, remainingSeconds, assertCompletable, assertStartWindowOpen } from './missionGuard';

const NOW = new Date('2026-07-12T10:00:00Z');

describe('needsPhoto / needsTimer', () => {
  it('PHOTO butuh foto saja', () => {
    expect(needsPhoto('PHOTO')).toBe(true);
    expect(needsTimer('PHOTO')).toBe(false);
  });
  it('TIMER butuh timer saja', () => {
    expect(needsPhoto('TIMER')).toBe(false);
    expect(needsTimer('TIMER')).toBe(true);
  });
  it('PHOTO_AND_TIMER butuh keduanya', () => {
    expect(needsPhoto('PHOTO_AND_TIMER')).toBe(true);
    expect(needsTimer('PHOTO_AND_TIMER')).toBe(true);
  });
});

describe('remainingSeconds', () => {
  it('menghitung sisa detik dari startedAt', () => {
    const startedAt = new Date(NOW.getTime() - 10 * 60 * 1000); // 10 menit lalu
    expect(remainingSeconds(startedAt, 15, NOW)).toBe(5 * 60);
  });
  it('tidak pernah negatif', () => {
    const startedAt = new Date(NOW.getTime() - 60 * 60 * 1000);
    expect(remainingSeconds(startedAt, 15, NOW)).toBe(0);
  });
});

describe('assertCompletable', () => {
  const base = {
    status: 'IN_PROGRESS' as const,
    proofType: 'PHOTO_AND_TIMER' as const,
    durationMinutes: 15,
    startedAt: new Date(NOW.getTime() - 16 * 60 * 1000),
    hasProof: true,
    now: NOW,
  };

  it('lolos saat semua syarat terpenuhi', () => {
    expect(() => assertCompletable(base)).not.toThrow();
  });

  it('MISSION_NOT_STARTED kalau status masih ASSIGNED', () => {
    expect(() => assertCompletable({ ...base, status: 'ASSIGNED' }))
      .toThrow(expect.objectContaining({ code: 'MISSION_NOT_STARTED' }));
  });

  it('MISSION_ALREADY_COMPLETED kalau sudah VERIFIED', () => {
    expect(() => assertCompletable({ ...base, status: 'VERIFIED' }))
      .toThrow(expect.objectContaining({ code: 'MISSION_ALREADY_COMPLETED' }));
  });

  it('TIMER_NOT_ELAPSED kalau durasi belum lewat', () => {
    const startedAt = new Date(NOW.getTime() - 5 * 60 * 1000);
    try {
      assertCompletable({ ...base, startedAt });
      expect.unreachable('harus throw');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('TIMER_NOT_ELAPSED');
      expect((err as AppError).message).toContain('600'); // sisa 600 detik
    }
  });

  it('PROOF_REQUIRED kalau misi berfoto tapi tidak ada file', () => {
    expect(() => assertCompletable({ ...base, hasProof: false }))
      .toThrow(expect.objectContaining({ code: 'PROOF_REQUIRED' }));
  });

  it('TIMER murni tanpa foto lolos', () => {
    expect(() => assertCompletable({ ...base, proofType: 'TIMER', hasProof: false }))
      .not.toThrow();
  });

  it('PHOTO murni tanpa startedAt timer tetap wajib start dulu', () => {
    expect(() => assertCompletable({
      ...base, proofType: 'PHOTO', durationMinutes: null, startedAt: null,
    })).toThrow(expect.objectContaining({ code: 'MISSION_NOT_STARTED' }));
  });
});

describe('assertStartWindowOpen', () => {
  // 2026-07-21T12:00:00Z = 19:00 WIB (UTC+7)
  it('menolak start pukul 19:00 waktu lokal (CLOSED)', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T12:00:00Z'), 'Asia/Jakarta'),
    ).toThrowError(expect.objectContaining({ code: 'MISSION_START_CLOSED' }));
  });

  it('mengizinkan start pukul 18:59 waktu lokal', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T11:59:00Z'), 'Asia/Jakarta'),
    ).not.toThrow();
  });

  // 2026-07-21T20:30:00Z = 03:30 WIB besoknya
  it('menolak start pukul 03:30 waktu lokal (NOT_OPEN)', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T20:30:00Z'), 'Asia/Jakarta'),
    ).toThrowError(expect.objectContaining({ code: 'MISSION_START_NOT_OPEN' }));
  });

  it('mengizinkan start tepat pukul 04:00 waktu lokal', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T21:00:00Z'), 'Asia/Jakarta'),
    ).not.toThrow();
  });

  it('menghormati timezone user, bukan WIB (New York UTC-4 saat DST)', () => {
    // 14:00Z = 10:00 New York (boleh) tapi 21:00 WIB (tutup)
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T14:00:00Z'), 'America/New_York'),
    ).not.toThrow();
  });

  it('timezone tidak valid jatuh ke WIB', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T12:00:00Z'), 'Not/AZone'),
    ).toThrowError(expect.objectContaining({ code: 'MISSION_START_CLOSED' }));
  });

  it('timezone kosong jatuh ke WIB', () => {
    expect(() => assertStartWindowOpen(new Date('2026-07-21T02:00:00Z'))).not.toThrow(); // 09:00 WIB
  });
});
