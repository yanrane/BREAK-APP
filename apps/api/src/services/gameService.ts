import { GameType } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { getWIBStartOfDay } from '../lib/dateUtils';

const DAILY_CAP = 20;

/**
 * Convert a game score (0-1000) to points (1-5).
 * - 0-199 → 1 point
 * - 200-399 → 2 points
 * - 400-599 → 3 points
 * - 600-799 → 4 points
 * - 800-1000 → 5 points
 *
 * Input is clamped to [0, 1000].
 */
export function calculateGamePoints(score: number): number {
  const clamped = Math.max(0, Math.min(1000, score));
  if (clamped >= 800) return 5;
  if (clamped >= 600) return 4;
  if (clamped >= 400) return 3;
  if (clamped >= 200) return 2;
  return 1;
}

/**
 * Apply daily cap (20 points/day from games) to a candidate points value.
 * Returns the actual points to award, capped at remaining budget.
 *
 * @param accumulated Current total points earned from games today
 * @param candidate Points candidate from this game submission
 * @returns Points to actually award (0 if cap reached)
 */
export function applyDailyCap(accumulated: number, candidate: number): number {
  return Math.max(0, Math.min(candidate, DAILY_CAP - accumulated));
}
