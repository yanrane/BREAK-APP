import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMissionHistory } from '../features/missions/useMissions';
import { cn } from '../lib/cn';

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Belum selesai',
  COMPLETED: 'Menunggu verifikasi',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
};

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED: 'text-gray-500',
  COMPLETED: 'text-yellow-600',
  VERIFIED: 'text-green-600',
  REJECTED: 'text-red-500',
};

const LIMIT = 20;

export default function MissionsHistory() {
  const [page, setPage] = useState(1);
  const { result, loading, error } = useMissionHistory(page, LIMIT);

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/missions" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-2xl font-bold">Riwayat Misi</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-gray-500 py-8">{error}</p>
      )}

      {!loading && !error && result && result.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📜</p>
          <p className="text-gray-500 text-sm">Belum ada riwayat misi.</p>
          <Link to="/missions" className="text-sm text-brand-600 hover:underline mt-2 inline-block">
            Lihat misi hari ini
          </Link>
        </div>
      )}

      {!loading && !error && result && result.items.length > 0 && (
        <>
          <div className="space-y-3">
            {result.items.map((um) => (
              <div
                key={um.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{um.mission.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(um.assignedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-xs font-medium', STATUS_COLOR[um.status])}>
                      {STATUS_LABEL[um.status]}
                    </p>
                    {um.pointsEarned > 0 && (
                      <p className="text-xs text-brand-600 font-semibold">
                        +{um.pointsEarned} pts
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              >
                ← Sebelumnya
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              >
                Berikutnya →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
