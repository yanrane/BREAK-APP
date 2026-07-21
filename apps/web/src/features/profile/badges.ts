export interface BadgeStats {
  missionsCompleted: number;
  longestStreak: number;
  petHatched: boolean;
  globalRank: number;
}

/** Badge dihitung dari statistik non-sensitif — dipakai halaman Profile & profil publik. */
export function computeBadges(s: BadgeStats): { emoji: string; label: string }[] {
  return [
    s.missionsCompleted >= 1 && { emoji: '🎯', label: 'Misi Pertama' },
    s.missionsCompleted >= 10 && { emoji: '🏅', label: '10 Misi Selesai' },
    s.missionsCompleted >= 50 && { emoji: '🏆', label: '50 Misi Selesai' },
    s.longestStreak >= 7 && { emoji: '🔥', label: 'Streak 7 Hari' },
    s.longestStreak >= 30 && { emoji: '⚡', label: 'Streak 30 Hari' },
    s.petHatched && { emoji: '🐣', label: 'Pet Menetas' },
    s.globalRank <= 10 && { emoji: '👑', label: 'Top 10 Global' },
  ].filter(Boolean) as { emoji: string; label: string }[];
}
