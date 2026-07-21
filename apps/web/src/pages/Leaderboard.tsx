import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeaderboard, type LeaderboardPeriod } from '../features/leaderboard/useLeaderboard';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/cn';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'alltime', label: 'Semua Waktu' },
];

const RANK_STYLE: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-[#FFD700]', text: 'text-ink', label: '🥇' },
  2: { bg: 'bg-[#C0C0C0]', text: 'text-ink', label: '🥈' },
  3: { bg: 'bg-[#CD7F32]', text: 'text-ink', label: '🥉' },
};

export default function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { entries, loading, error } = useLeaderboard(period);
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="border-b-2 border-ink pb-5 mb-6">
        <p className="text-label mb-1">Kompetisi</p>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">Leaderboard</h1>
      </div>

      {/* Period tabs */}
      <div className="flex border-2 border-ink mb-6 shadow-hard">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={cn(
              'flex-1 py-2.5 text-sm font-extrabold transition-colors border-r-2 border-ink last:border-r-0',
              period === value
                ? 'bg-ink text-cream'
                : 'bg-cream text-ink hover:bg-cream-2',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-2 border-ink/20 bg-cream-2 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-ink p-8 shadow-hard text-center">
          <p className="text-muted font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="border-2 border-ink p-10 shadow-hard text-center">
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-extrabold text-lg mb-1">Belum ada data</p>
          <p className="text-sm text-muted font-medium">Selesaikan misi untuk masuk ranking!</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="border-2 border-ink shadow-hard divide-y-2 divide-ink">
          {entries.map((entry) => {
            const rankStyle = RANK_STYLE[entry.rank];
            const isMe = entry.userId === currentUserId;
            return (
              <Link
                key={entry.userId}
                to={`/u/${entry.username}`}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 transition-colors',
                  isMe ? 'bg-lime' : 'bg-cream hover:bg-cream-2',
                )}
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-10 h-10 border-2 border-ink flex items-center justify-center shrink-0 text-sm font-extrabold',
                    rankStyle ? rankStyle.bg : 'bg-cream-2',
                  )}
                >
                  {rankStyle ? rankStyle.label : entry.rank}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 border-2 border-ink bg-cream-2 flex items-center justify-center shrink-0 overflow-hidden">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-extrabold">
                      {entry.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <span className="flex-1 font-bold text-sm truncate">
                  {entry.username}
                  {isMe && <span className="ml-2 text-xs font-extrabold text-ink/50">(kamu)</span>}
                </span>

                <span className="text-sm font-extrabold shrink-0">
                  {entry.points.toLocaleString('id-ID')}
                  <span className="text-xs font-bold text-muted ml-1">pts</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
