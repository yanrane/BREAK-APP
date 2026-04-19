import { describe, it, expect } from 'vitest';
import { calculateGamePoints, applyDailyCap } from './gameService';

describe('calculateGamePoints', () => {
  it.each([
    [0, 1],
    [199, 1],
    [200, 2],
    [399, 2],
    [400, 3],
    [599, 3],
    [600, 4],
    [799, 4],
    [800, 5],
    [1000, 5],
  ])('score %i → %i points', (score, expected) => {
    expect(calculateGamePoints(score)).toBe(expected);
  });

  it('clamps negative input — returns 1 point', () => {
    expect(calculateGamePoints(-50)).toBe(1);
  });

  it('clamps above-1000 input — returns 5 points', () => {
    expect(calculateGamePoints(1500)).toBe(5);
  });
});

describe('applyDailyCap', () => {
  it('awards full candidate when under cap', () => {
    expect(applyDailyCap(0, 5)).toBe(5);
  });

  it('partial award when near cap', () => {
    expect(applyDailyCap(18, 5)).toBe(2);
  });

  it('returns 0 when cap already reached', () => {
    expect(applyDailyCap(20, 5)).toBe(0);
  });

  it('returns 0 when accumulated exceeds cap', () => {
    expect(applyDailyCap(25, 5)).toBe(0);
  });

  it('awards exactly remaining when candidate exceeds gap', () => {
    expect(applyDailyCap(17, 5)).toBe(3);
  });
});
