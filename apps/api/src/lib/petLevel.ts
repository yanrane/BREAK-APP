/**
 * Sistem level pet: level diturunkan murni dari EXP (tanpa kolom level),
 * kurva 50·(L−1)^1.5 sehingga kebutuhan naik bertahap dan aman untuk
 * level 1000+ (closed-form, tanpa loop).
 */

/** Total EXP yang dibutuhkan untuk mencapai level L (L≥1). */
export function expForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(50 * Math.pow(level - 1, 1.5));
}

/** Level pet dari total EXP — invers closed-form dari expForLevel. */
export function petLevel(exp: number): number {
  if (exp <= 0) return 1;
  const level = Math.floor(Math.pow(exp / 50, 2 / 3)) + 1;
  // Koreksi pembulatan floating point di tepi threshold
  if (expForLevel(level + 1) <= exp) return level + 1;
  if (expForLevel(level) > exp) return level - 1;
  return level;
}

/** Reward eksklusif berhenti di level ini; setelahnya murni prestige. */
export const MAX_REWARD_LEVEL = 200;

/** Milestone utama sesuai desain (level → label + coins). */
const MAJOR_MILESTONES: Record<number, { label: string; coins: number }> = {
  5: { label: 'Pet Accessory I', coins: 20 },
  10: { label: 'Pet Accessory II', coins: 25 },
  15: { label: 'Exclusive Emote Pack', coins: 30 },
  20: { label: 'Pet Animation', coins: 35 },
  25: { label: 'Coin Reward', coins: 50 },
  30: { label: 'Profile Decoration', coins: 40 },
  40: { label: 'Pet Evolution Stage 1', coins: 60 },
  50: { label: 'Exclusive Profile Background', coins: 75 },
  60: { label: 'Coin Reward', coins: 80 },
  75: { label: 'Large Coin Reward', coins: 120 },
  90: { label: 'Rare Pet Effect', coins: 100 },
  100: { label: 'Pet Evolution Stage 2', coins: 150 },
  125: { label: 'Premium Profile Background', coins: 150 },
  150: { label: 'Legendary Emote Pack', coins: 180 },
  175: { label: 'Massive Coin Reward', coins: 250 },
  200: { label: 'Final Evolution + Legendary Title', coins: 400 },
};

/** Coins hadiah kecil untuk kelipatan 5 di antara milestone utama. */
const MINOR_MILESTONE_COINS = 15;

export interface Milestone {
  level: number;
  label: string;
  coins: number;
  major: boolean;
}

/** Daftar lengkap milestone (kelipatan 5 sampai MAX_REWARD_LEVEL) untuk UI. */
export function allMilestones(): Milestone[] {
  const list: Milestone[] = [];
  for (let lvl = 5; lvl <= MAX_REWARD_LEVEL; lvl += 5) {
    const major = MAJOR_MILESTONES[lvl];
    list.push(
      major
        ? { level: lvl, label: major.label, coins: major.coins, major: true }
        : { level: lvl, label: 'Hadiah Kecil', coins: MINOR_MILESTONE_COINS, major: false },
    );
  }
  return list;
}

/**
 * Kumpulkan reward milestone yang belum diklaim di rentang
 * (lastRewardLevel, min(currentLevel, 200)]. Return coins & daftar label.
 */
export function collectMilestones(
  lastRewardLevel: number,
  currentLevel: number,
): { coins: number; unlocked: Milestone[]; newLastRewardLevel: number } {
  const upTo = Math.min(currentLevel, MAX_REWARD_LEVEL);
  const unlocked = allMilestones().filter((m) => m.level > lastRewardLevel && m.level <= upTo);
  return {
    coins: unlocked.reduce((sum, m) => sum + m.coins, 0),
    unlocked,
    newLastRewardLevel: Math.max(lastRewardLevel, upTo),
  };
}

/** Prestige: threshold dobel mulai 500 (I=500, II=1000, III=2000, ...). */
export function prestigeInfo(level: number): { tier: number; title: string | null; nextAt: number } {
  const TITLES = ['Veteran Trainer', 'Master of Focus', 'Legendary Breaker'];
  let tier = 0;
  let threshold = 500;
  while (level >= threshold) {
    tier++;
    threshold *= 2;
  }
  return {
    tier,
    title: tier > 0 ? TITLES[Math.min(tier, TITLES.length) - 1] : null,
    nextAt: threshold,
  };
}
