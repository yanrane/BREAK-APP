import { useState } from 'react';
import { useLeaderboard, type LeaderboardPeriod } from '../features/leaderboard/useLeaderboard';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/cn';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'alltime', label: 'Semua Waktu' },
];

const RANK_BADGE: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-orange-400 text-orange-900',
};

export default function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { entries, loading, error } = useLeaderboard(period);
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              period === value
                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-gray-500 py-8">{error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🏆</p>
          <p className="text-sm text-gray-500">Belum ada data untuk periode ini.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                entry.userId === currentUserId && 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-950',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  RANK_BADGE[entry.rank] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                )}
              >
                {entry.rank}
              </div>

              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0 overflow-hidden">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {entry.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <span className="flex-1 text-sm font-medium truncate">
                {entry.username}
                {entry.userId === currentUserId && (
                  <span className="ml-1 text-xs text-brand-500">(kamu)</span>
                )}
              </span>

              <span className="text-sm font-bold text-brand-600">
                {entry.points.toLocaleString('id-ID')} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
