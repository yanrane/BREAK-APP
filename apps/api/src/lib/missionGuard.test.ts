import { describe, it, expect } from 'vitest';
import { AppError } from './appError';
import { needsPhoto, needsTimer, remainingSeconds, assertCompletable } from './missionGuard';

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
