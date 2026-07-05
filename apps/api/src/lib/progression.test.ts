import { describe, it, expect } from 'vitest';
import { nextStreak, stageForExp, rollRarity, wibDayIndex, unlockedFeatures } from './progression';

const base = { currentStreak: 5, longestStreak: 7, lastBrokenStreak: 0 };

describe('nextStreak', () => {
  it('misi pertama memulai streak 1', () => {
    const r = nextStreak({ ...base, currentStreak: 0, longestStreak: 0, lastMissionDate: null }, new Date());
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(1);
  });

  it('misi kedua di hari yang sama tidak menambah streak', () => {
    const now = new Date('2026-07-05T10:00:00+07:00');
    const r = nextStreak({ ...base, lastMissionDate: new Date('2026-07-05T08:00:00+07:00') }, now);
    expect(r.currentStreak).toBe(5);
  });

  it('misi di hari berikutnya menambah streak dan update longest', () => {
    const now = new Date('2026-07-05T10:00:00+07:00');
    const r = nextStreak(
      { currentStreak: 7, longestStreak: 7, lastBrokenStreak: 0, lastMissionDate: new Date('2026-07-04T23:00:00+07:00') },
      now,
    );
    expect(r.currentStreak).toBe(8);
    expect(r.longestStreak).toBe(8);
  });

  it('melewatkan satu hari memutus streak dan menyimpan lastBrokenStreak', () => {
    const now = new Date('2026-07-05T10:00:00+07:00');
    const r = nextStreak({ ...base, lastMissionDate: new Date('2026-07-03T10:00:00+07:00') }, now);
    expect(r.currentStreak).toBe(1);
    expect(r.lastBrokenStreak).toBe(5);
    expect(r.longestStreak).toBe(7);
  });

  it('batas hari mengikuti WIB, bukan UTC', () => {
    // 2026-07-04 23:30 WIB = 16:30 UTC; 2026-07-05 00:30 WIB adalah hari berikutnya
    const a = wibDayIndex(new Date('2026-07-04T23:30:00+07:00'));
    const b = wibDayIndex(new Date('2026-07-05T00:30:00+07:00'));
    expect(b - a).toBe(1);
  });
});

describe('stageForExp', () => {
  it('mengembalikan stage sesuai threshold', () => {
    expect(stageForExp(0)).toBe('EGG');
    expect(stageForExp(99)).toBe('EGG');
    expect(stageForExp(100)).toBe('BABY');
    expect(stageForExp(500)).toBe('TEEN');
    expect(stageForExp(1500)).toBe('ADULT');
  });
});

describe('rollRarity', () => {
  it('rng rendah memberi rarity tinggi', () => {
    expect(rollRarity(0, () => 0.01)).toBe('LEGENDARY');
    expect(rollRarity(0, () => 0.1)).toBe('EPIC');
    expect(rollRarity(0, () => 0.3)).toBe('RARE');
    expect(rollRarity(0, () => 0.9)).toBe('COMMON');
  });

  it('EXP tinggi meningkatkan peluang rarity', () => {
    // roll 0.6: dengan exp 1000 bonus penuh → RARE (0.5+0.3=0.8), tanpa bonus → COMMON
    expect(rollRarity(1000, () => 0.6)).toBe('RARE');
    expect(rollRarity(0, () => 0.6)).toBe('COMMON');
  });
});

describe('unlockedFeatures', () => {
  it('membuka fitur bertahap per stage', () => {
    expect(unlockedFeatures('EGG')).toEqual([]);
    expect(unlockedFeatures('BABY')).toEqual(['emote']);
    expect(unlockedFeatures('TEEN')).toEqual(['emote', 'outfit']);
    expect(unlockedFeatures('ADULT')).toEqual(['emote', 'outfit', 'cosmetic']);
  });
});
