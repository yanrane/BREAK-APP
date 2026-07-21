import { describe, it, expect } from 'vitest';
import { petLevel, expForLevel, collectMilestones, prestigeInfo, MAX_REWARD_LEVEL } from './petLevel';

describe('petLevel / expForLevel', () => {
  it('level 1 pada 0 EXP', () => {
    expect(petLevel(0)).toBe(1);
    expect(expForLevel(1)).toBe(0);
  });

  it('konsisten bolak-balik: petLevel(expForLevel(L)) === L', () => {
    for (const lvl of [2, 5, 10, 50, 100, 200, 500, 1000, 2000]) {
      expect(petLevel(expForLevel(lvl))).toBe(lvl);
      // 1 EXP sebelum threshold masih level sebelumnya
      expect(petLevel(expForLevel(lvl) - 1)).toBe(lvl - 1);
    }
  });

  it('monotonik naik', () => {
    let prev = 0;
    for (let exp = 0; exp <= 20000; exp += 137) {
      const lvl = petLevel(exp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it('level 1000+ tanpa masalah performa (closed-form)', () => {
    expect(petLevel(expForLevel(5000))).toBe(5000);
  });
});

describe('collectMilestones', () => {
  it('mengambil milestone di rentang yang belum diklaim', () => {
    const { coins, unlocked, newLastRewardLevel } = collectMilestones(0, 12);
    expect(unlocked.map((m) => m.level)).toEqual([5, 10]);
    expect(coins).toBe(20 + 25);
    expect(newLastRewardLevel).toBe(12);
  });

  it('tidak dobel klaim', () => {
    const { unlocked } = collectMilestones(10, 12);
    expect(unlocked).toHaveLength(0);
  });

  it('berhenti di MAX_REWARD_LEVEL — prestige tanpa reward milestone', () => {
    const { unlocked, newLastRewardLevel } = collectMilestones(195, 300);
    expect(unlocked.map((m) => m.level)).toEqual([200]);
    expect(newLastRewardLevel).toBe(MAX_REWARD_LEVEL);
    const again = collectMilestones(newLastRewardLevel, 500);
    expect(again.unlocked).toHaveLength(0);
    expect(again.coins).toBe(0);
  });
});

describe('prestigeInfo', () => {
  it('tanpa prestige di bawah 500', () => {
    expect(prestigeInfo(499)).toEqual({ tier: 0, title: null, nextAt: 500 });
  });
  it('Prestige I di 500, II di 1000, III di 2000', () => {
    expect(prestigeInfo(500)).toMatchObject({ tier: 1, title: 'Veteran Trainer', nextAt: 1000 });
    expect(prestigeInfo(1000)).toMatchObject({ tier: 2, title: 'Master of Focus', nextAt: 2000 });
    expect(prestigeInfo(2500)).toMatchObject({ tier: 3, title: 'Legendary Breaker', nextAt: 4000 });
  });
});
