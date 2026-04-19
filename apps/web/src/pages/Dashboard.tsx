import { Link } from 'react-router-dom';
import { useDashboard } from '../features/dashboard/useDashboard';

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-16 bg-cream-2 border-2 border-ink/20" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-cream-2 border-2 border-ink/20" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl text-center py-16 border-2 border-ink shadow-hard">
        <p className="text-muted font-semibold mb-3">{error ?? 'Gagal memuat data'}</p>
        <button onClick={refetch} className="text-sm font-extrabold underline decoration-lime decoration-2">
          Coba lagi
        </button>
      </div>
    );
  }

  const missionPct = data.todayMissions.total > 0
    ? Math.round((data.todayMissions.completed / data.todayMissions.total) * 100)
    : 0;

  return (
    <div className="max-w-2xl space-y-6">

      {/* Greeting */}
      <div className="border-b-2 border-ink pb-5">
        <p className="text-label mb-1">Selamat datang kembali</p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-none tracking-tight">
          {data.user.username}.
        </h1>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-ink p-5 shadow-hard bg-ink text-cream">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-2 text-cream/50">
            Total Poin
          </p>
          <p className="text-5xl font-extrabold leading-none">
            {data.user.totalPoints.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="border-2 border-ink p-5 shadow-hard bg-lime">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-2 text-ink/50">
            Streak
          </p>
          <p className="text-5xl font-extrabold leading-none">
            {data.user.currentStreak}
            <span className="text-lg font-bold ml-1 text-ink/60">hari</span>
          </p>
        </div>

        <div className="border-2 border-ink p-5 shadow-hard bg-cream col-span-2">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-label mb-1">Misi Hari Ini</p>
              <p className="text-4xl font-extrabold leading-none">
                {data.todayMissions.completed}
                <span className="text-xl font-bold text-muted">/{data.todayMissions.total}</span>
              </p>
            </div>
            {data.weeklyRank && (
              <div className="text-right">
                <p className="text-label mb-1">Ranking Minggu</p>
                <p className="text-4xl font-extrabold leading-none">#{data.weeklyRank}</p>
              </div>
            )}
          </div>
          {data.todayMissions.total > 0 && (
            <div className="h-2 border-2 border-ink overflow-hidden">
              <div
                className="h-full bg-lime transition-all duration-500"
                style={{ width: `${missionPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mini leaderboard */}
      {data.topLeaderboard.length > 0 && (
        <div className="border-2 border-ink shadow-hard">
          <div className="flex items-center justify-between border-b-2 border-ink px-5 py-3">
            <p className="text-xs font-extrabold uppercase tracking-widest">Top 5 Minggu Ini</p>
            <Link to="/leaderboard" className="text-xs font-extrabold underline decoration-lime decoration-2">
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y-2 divide-ink">
            {data.topLeaderboard.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-4 px-5 py-3">
                <span className="text-2xl font-extrabold text-muted w-8">
                  {entry.rank}
                </span>
                <div className="w-8 h-8 border-2 border-ink bg-lime flex items-center justify-center shrink-0">
                  <span className="text-xs font-extrabold text-ink">
                    {entry.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="flex-1 text-sm font-bold truncate">{entry.username}</span>
                <span className="text-sm font-extrabold">{entry.points.toLocaleString('id-ID')} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/missions"
          className="border-2 border-ink p-5 shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 bg-cream group"
        >
          <p className="text-3xl mb-3">📋</p>
          <p className="font-extrabold text-sm">Lihat Misi →</p>
        </Link>
        <Link
          to="/games"
          className="border-2 border-ink p-5 shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 bg-cream-2"
        >
          <p className="text-3xl mb-3">⚡</p>
          <p className="font-extrabold text-sm">Main Game →</p>
        </Link>
      </div>
    </div>
  );
}
