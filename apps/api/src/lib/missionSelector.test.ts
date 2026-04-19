import { describe, it, expect } from 'vitest';
import { selectDailyMissions } from './missionSelector';

const mission = (id: string, category: 'PHYSICAL' | 'MENTAL' | 'SOCIAL' | 'CREATIVE') => ({ id, category });

describe('selectDailyMissions', () => {
  it('returns exactly 3 missions from a full pool', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('p2', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('m2', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    expect(result).toHaveLength(3);
  });

  it('includes 1 PHYSICAL mission when available', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
    ];
    const result = selectDailyMissions(pool);
    const categories = result.map(m => m.category);
    expect(categories).toContain('PHYSICAL');
  });

  it('includes 1 MENTAL mission when available', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
    ];
    const result = selectDailyMissions(pool);
    const categories = result.map(m => m.category);
    expect(categories).toContain('MENTAL');
  });

  it('fills 3rd slot with SOCIAL or CREATIVE', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    const categories = result.map(m => m.category);
    const hasSocialOrCreative = categories.includes('SOCIAL') || categories.includes('CREATIVE');
    expect(hasSocialOrCreative).toBe(true);
  });

  it('returns no duplicate mission IDs', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    const ids = result.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back to any category if PHYSICAL pool is empty', () => {
    const pool = [
      mission('m1', 'MENTAL'),
      mission('m2', 'MENTAL'),
      mission('s1', 'SOCIAL'),
      mission('c1', 'CREATIVE'),
    ];
    const result = selectDailyMissions(pool);
    expect(result).toHaveLength(3);
    const ids = result.map(m => m.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('returns all available missions when pool has fewer than 3', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
    ];
    const result = selectDailyMissions(pool);
    expect(result).toHaveLength(2);
  });

  it('fills 3rd slot from any category when SOCIAL and CREATIVE are both empty', () => {
    const pool = [
      mission('p1', 'PHYSICAL'),
      mission('m1', 'MENTAL'),
      mission('m2', 'MENTAL'),
    ];
    const result = selectDailyMissions(pool);
    expect(result).toHaveLength(3);
    expect(new Set(result.map((m) => m.id)).size).toBe(3);
  });

  it('returns empty array for empty pool', () => {
    expect(selectDailyMissions([])).toHaveLength(0);
  });
});
