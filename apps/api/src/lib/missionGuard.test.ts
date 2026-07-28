import { describe, it, expect } from 'vitest';
import { AppError } from './appError';
import { needsPhoto, needsTimer, remainingSeconds, assertCompletable, assertStartWindowOpen, MIN_SUMMARY_LENGTH, MISSION_START_OPEN_HOUR, MISSION_START_CLOSE_HOUR } from './missionGuard';

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
    requiresSummary: false,
    now: NOW,
  };

  it('lolos saat semua syarat terpenuhi', () => {
    expect(() => assertCompletable(base)).not.toThrow();
  });

  describe('rangkuman wajib (misi baca/jurnal)', () => {
    const longEnough = 'a'.repeat(MIN_SUMMARY_LENGTH);

    it('menolak saat rangkuman kosong', () => {
      expect(() => assertCompletable({ ...base, requiresSummary: true })).toThrow(
        /rangkuman/i,
      );
    });

    it('menolak saat rangkuman terlalu pendek', () => {
      expect(() =>
        assertCompletable({ ...base, requiresSummary: true, summary: 'pendek' }),
      ).toThrow(/rangkuman/i);
    });

    it('menolak rangkuman yang hanya spasi', () => {
      expect(() =>
        assertCompletable({ ...base, requiresSummary: true, summary: ' '.repeat(300) }),
      ).toThrow(/rangkuman/i);
    });

    it('lolos saat rangkuman cukup panjang', () => {
      expect(() =>
        assertCompletable({ ...base, requiresSummary: true, summary: longEnough }),
      ).not.toThrow();
    });

    it('mengabaikan rangkuman untuk misi yang tidak mewajibkannya', () => {
      expect(() =>
        assertCompletable({ ...base, requiresSummary: false, summary: undefined }),
      ).not.toThrow();
    });
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
  it('jendelanya 04:00–08:00', () => {
    expect(MISSION_START_OPEN_HOUR).toBe(4);
    expect(MISSION_START_CLOSE_HOUR).toBe(8);
  });

  // 2026-07-21T01:00:00Z = 08:00 WIB (UTC+7)
  it('menolak start tepat pukul 08:00 waktu lokal (CLOSED)', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T01:00:00Z'), 'Asia/Jakarta'),
    ).toThrowError(expect.objectContaining({ code: 'MISSION_START_CLOSED' }));
  });

  it('mengizinkan start pukul 07:59 waktu lokal', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T00:59:00Z'), 'Asia/Jakarta'),
    ).not.toThrow();
  });

  it('menolak start siang hari (12:00 WIB, sudah lewat jendela)', () => {
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T05:00:00Z'), 'Asia/Jakarta'),
    ).toThrowError(expect.objectContaining({ code: 'MISSION_START_CLOSED' }));
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

  it('jendela berulang tiap hari: 05:00 buka, 09:00 tutup, 14 hari berturut-turut', () => {
    for (let d = 0; d < 14; d++) {
      const dayMs = d * 24 * 60 * 60 * 1000;
      // 22:00Z = 05:00 WIB keesokan harinya → di dalam jendela
      const inWindow = new Date(new Date('2026-07-20T22:00:00Z').getTime() + dayMs);
      expect(() => assertStartWindowOpen(inWindow, 'Asia/Jakarta')).not.toThrow();

      // 02:00Z = 09:00 WIB hari yang sama → sudah lewat jendela
      const afterWindow = new Date(new Date('2026-07-21T02:00:00Z').getTime() + dayMs);
      expect(() => assertStartWindowOpen(afterWindow, 'Asia/Jakarta')).toThrowError(
        expect.objectContaining({ code: 'MISSION_START_CLOSED' }),
      );
    }
  });

  it('menghormati timezone user, bukan WIB (New York UTC-4 saat DST)', () => {
    // 10:00Z = 06:00 New York (boleh) tapi 17:00 WIB (tutup)
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T10:00:00Z'), 'America/New_York'),
    ).not.toThrow();
  });

  it('timezone tidak valid jatuh ke WIB', () => {
    // 01:00Z = 08:00 WIB → tutup
    expect(() =>
      assertStartWindowOpen(new Date('2026-07-21T01:00:00Z'), 'Not/AZone'),
    ).toThrowError(expect.objectContaining({ code: 'MISSION_START_CLOSED' }));
  });

  it('timezone kosong jatuh ke WIB', () => {
    expect(() => assertStartWindowOpen(new Date('2026-07-21T00:00:00Z'))).not.toThrow(); // 07:00 WIB
  });
});
