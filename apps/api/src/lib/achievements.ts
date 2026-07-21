/**
 * Definisi achievement. Status unlock disimpan di tabel UserAchievement;
 * definisi (judul, syarat, hadiah coins) cukup di kode — menambah achievement
 * baru tinggal menambah entri di sini.
 */

export interface AchievementStats {
  missionsCompleted: number;
  longestStreak: number;
  quizCount: number;
  distinctGameTypes: number;
  petLevel: number;
  totalPoints: number;
}

export interface AchievementDef {
  code: string;
  emoji: string;
  title: string;
  description: string;
  coins: number;
  isUnlocked: (s: AchievementStats) => boolean;
}

/** Jumlah jenis mini game yang tersedia (REACTION..QUIZ). */
export const TOTAL_GAME_TYPES = 7;

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: 'FIRST_MISSION', emoji: '🎯', title: 'Misi Pertama', description: 'Selesaikan 1 misi', coins: 10, isUnlocked: (s) => s.missionsCompleted >= 1 },
  { code: 'MISSION_10', emoji: '🏅', title: '10 Misi', description: 'Selesaikan 10 misi', coins: 30, isUnlocked: (s) => s.missionsCompleted >= 10 },
  { code: 'MISSION_50', emoji: '🏆', title: '50 Misi', description: 'Selesaikan 50 misi', coins: 100, isUnlocked: (s) => s.missionsCompleted >= 50 },
  { code: 'MISSION_100', emoji: '👑', title: '100 Misi', description: 'Selesaikan 100 misi', coins: 200, isUnlocked: (s) => s.missionsCompleted >= 100 },
  { code: 'STREAK_7', emoji: '🔥', title: 'Seminggu Konsisten', description: 'Streak 7 hari', coins: 50, isUnlocked: (s) => s.longestStreak >= 7 },
  { code: 'STREAK_30', emoji: '⚡', title: 'Sebulan Membara', description: 'Streak 30 hari', coins: 150, isUnlocked: (s) => s.longestStreak >= 30 },
  { code: 'QUIZ_10', emoji: '🧠', title: 'Kutu Kuis', description: 'Selesaikan 10 kuis harian', coins: 30, isUnlocked: (s) => s.quizCount >= 10 },
  { code: 'QUIZ_100', emoji: '🎓', title: 'Profesor Kuis', description: 'Selesaikan 100 kuis harian', coins: 200, isUnlocked: (s) => s.quizCount >= 100 },
  { code: 'GAMES_ALL', emoji: '🕹️', title: 'Penjelajah Game', description: 'Mainkan semua jenis mini game', coins: 60, isUnlocked: (s) => s.distinctGameTypes >= TOTAL_GAME_TYPES },
  { code: 'PET_LV_10', emoji: '🐣', title: 'Pet Pemula', description: 'Pet mencapai level 10', coins: 25, isUnlocked: (s) => s.petLevel >= 10 },
  { code: 'PET_LV_50', emoji: '🐥', title: 'Pet Terlatih', description: 'Pet mencapai level 50', coins: 75, isUnlocked: (s) => s.petLevel >= 50 },
  { code: 'PET_LV_100', emoji: '🦅', title: 'Pet Legendaris', description: 'Pet mencapai level 100', coins: 150, isUnlocked: (s) => s.petLevel >= 100 },
  { code: 'PET_LV_200', emoji: '🌟', title: 'Evolusi Final', description: 'Pet mencapai level 200', coins: 400, isUnlocked: (s) => s.petLevel >= 200 },
  { code: 'POINTS_1000', emoji: '💎', title: 'Kolektor Poin', description: 'Kumpulkan 1000 total poin', coins: 100, isUnlocked: (s) => s.totalPoints >= 1000 },
];
