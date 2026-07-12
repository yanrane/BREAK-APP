import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMissionHistory } from '../features/missions/useMissions';
import { cn } from '../lib/cn';

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Belum selesai',
  IN_PROGRESS: 'Berlangsung',
  COMPLETED: 'Menunggu verifikasi',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
};

const STATUS_STYLE: Record<string, string> = {
  ASSIGNED: 'bg-cream-2 text-muted border-ink/30',
  IN_PROGRESS: 'border-ink bg-cream',
  COMPLETED: 'bg-[#FFF9C4] text-[#854D0E] border-[#854D0E]',
  VERIFIED: 'bg-lime text-ink border-ink',
  REJECTED: 'bg-red-100 text-coral border-coral',
};

const LIMIT = 20;

export default function MissionsHistory() {
  const [page, setPage] = useState(1);
  const { result, loading, error } = useMissionHistory(page, LIMIT);
  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 border-b-2 border-ink pb-5 mb-6">
        <Link
          to="/missions"
          className="text-sm font-extrabold border-2 border-ink px-2.5 py-1 shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          ←
        </Link>
        <div>
          <p className="text-label mb-0.5">Catatan</p>
          <h1 className="text-3xl font-extrabold leading-none">Riwayat Misi</h1>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 border-2 border-ink/20 bg-cream-2 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-ink p-8 shadow-hard text-center">
          <p className="text-muted font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && result && result.items.length === 0 && (
        <div className="border-2 border-ink p-10 shadow-hard text-center">
          <p className="text-4xl mb-4">📜</p>
          <p className="font-extrabold text-lg mb-1">Belum ada riwayat</p>
          <Link to="/missions" className="text-sm font-extrabold underline decoration-lime decoration-2">
            Lihat misi hari ini →
          </Link>
        </div>
      )}

      {!loading && !error && result && result.items.length > 0 && (
        <>
          <div className="border-2 border-ink shadow-hard divide-y-2 divide-ink">
            {result.items.map((um) => (
              <div key={um.id} className="flex items-start justify-between gap-3 px-4 py-3 bg-cream hover:bg-cream-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold leading-tight truncate">{um.mission.title}</p>
                  <p className="text-xs text-muted font-semibold mt-0.5">
                    {new Date(um.assignedAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <span className={cn('inline-block text-xs font-extrabold px-2 py-0.5 border-2', STATUS_STYLE[um.status])}>
                    {STATUS_LABEL[um.status]}
                  </span>
                  {um.pointsEarned > 0 && (
                    <p className="text-xs font-extrabold text-ink">+{um.pointsEarned} pts</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-extrabold border-2 border-ink shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-40 disabled:transform-none disabled:shadow-none"
              >
                ← Sebelumnya
              </button>
              <span className="text-sm font-bold text-muted">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-extrabold border-2 border-ink shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-40 disabled:transform-none disabled:shadow-none"
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
