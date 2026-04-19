import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWIBStartOfDay } from './dateUtils';

describe('getWIBStartOfDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns midnight WIB when UTC time is within the same WIB day', () => {
    // 10:00 UTC on 2026-04-19 = 17:00 WIB on 2026-04-19
    vi.setSystemTime(new Date('2026-04-19T10:00:00.000Z'));
    const result = getWIBStartOfDay();
    // Midnight WIB 2026-04-19 = 17:00 UTC 2026-04-18
    expect(result.toISOString()).toBe('2026-04-18T17:00:00.000Z');
  });

  it('returns midnight WIB for the NEXT calendar day when UTC is after 17:00', () => {
    // 18:00 UTC on 2026-04-19 = 01:00 WIB on 2026-04-20
    vi.setSystemTime(new Date('2026-04-19T18:00:00.000Z'));
    const result = getWIBStartOfDay();
    // Midnight WIB 2026-04-20 = 17:00 UTC 2026-04-19
    expect(result.toISOString()).toBe('2026-04-19T17:00:00.000Z');
  });

  it('returns UTC Date object', () => {
    vi.setSystemTime(new Date('2026-04-19T10:00:00.000Z'));
    const result = getWIBStartOfDay();
    expect(result).toBeInstanceOf(Date);
  });

  it('handles the exact WIB midnight boundary (17:00:00 UTC)', () => {
    // Exactly 17:00:00.000 UTC = 00:00:00 WIB on the next calendar day
    vi.setSystemTime(new Date('2026-04-19T17:00:00.000Z'));
    const result = getWIBStartOfDay();
    expect(result.toISOString()).toBe('2026-04-19T17:00:00.000Z');
  });
});
