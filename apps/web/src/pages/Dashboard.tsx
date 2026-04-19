import { Link } from 'react-router-dom';
import { useDashboard } from '../features/dashboard/useDashboard';
import { cn } from '../lib/cn';

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">{error ?? 'Gagal memuat data'}</p>
        <button onClick={refetch} className="text-sm text-brand-600 hover:underline mt-2">
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hei, {data.user.username} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selamat datang di BREAK</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Poin</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">
            {data.user.totalPoints.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Streak</p>
          <p className="text-2xl font-bold mt-1">
            {data.user.currentStreak}
            <span className="text-sm font-normal text-gray-500 ml-1">hari</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Misi Hari Ini</p>
          <p className="text-2xl font-bold mt-1">
            {data.todayMissions.completed}
            <span className="text-sm font-normal text-gray-500">
              /{data.todayMissions.total}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ranking Minggu Ini</p>
          <p className="text-2xl font-bold mt-1">
            {data.weeklyRank ? `#${data.weeklyRank}` : '–'}
          </p>
        </div>
      </div>

      {data.topLeaderboard.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Top 5 Minggu Ini</h2>
            <Link to="/leaderboard" className="text-sm text-brand-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="space-y-2">
            {data.topLeaderboard.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3 py-1">
                <span className="w-5 text-xs font-semibold text-gray-500">#{entry.rank}</span>
                <span className="flex-1 text-sm">{entry.username}</span>
                <span className="text-sm font-semibold text-brand-600">{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/missions"
          className={cn(
            'rounded-xl border p-4 text-center transition-colors',
            'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-400',
          )}
        >
          <p className="text-2xl mb-1">📋</p>
          <p className="text-sm font-medium">Lihat Misi</p>
        </Link>
        <Link
          to="/games"
          className={cn(
            'rounded-xl border p-4 text-center transition-colors',
            'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-400',
          )}
        >
          <p className="text-2xl mb-1">🎮</p>
          <p className="text-sm font-medium">Main Game</p>
        </Link>
      </div>
    </div>
  );
}
