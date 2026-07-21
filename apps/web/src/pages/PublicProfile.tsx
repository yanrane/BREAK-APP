import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { computeBadges } from '../features/profile/badges';
import {
  petEmoji,
  RARITY_STYLES,
  STAGE_LABELS,
  type PetStage,
  type PetRarity,
} from '../features/profile/useReport';
import { cn } from '../lib/cn';

interface PublicProfileData {
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  missionsCompleted: number;
  globalRank: number;
  pet: { name: string; stage: PetStage; rarity: PetRarity; hatchedAt: string | null } | null;
}

const cardClass = 'border-2 border-ink p-5 shadow-hard bg-cream';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);
    api
      .get<{ success: true; data: PublicProfileData }>(
        `/users/${encodeURIComponent(username ?? '')}`,
      )
      .then((res) => {
        if (!cancelled) setData(res.data.data);
      })
      .catch((err: { response?: { status?: number } }) => {
        if (cancelled) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError('Gagal memuat profil. Coba lagi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const backButton = (
    <button
      onClick={() => navigate(-1)}
      className="text-sm font-extrabold underline decoration-lime decoration-2 hover:text-muted transition-colors"
    >
      ← Kembali
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-10 w-48 border-2 border-ink/20 bg-cream-2 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 border-2 border-ink/20 bg-cream-2 animate-pulse" />
          ))}
        </div>
        <div className="h-36 border-2 border-ink/20 bg-cream-2 animate-pulse" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="border-2 border-ink p-10 shadow-hard text-center max-w-xl">
        <p className="text-5xl mb-4">🔍</p>
        <p className="font-extrabold text-xl mb-2">Pengguna tidak ditemukan</p>
        <p className="text-sm text-muted font-medium mb-5">
          Profil “{username}” tidak ada atau sudah dihapus.
        </p>
        {backButton}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-2 border-coral p-10 shadow-hard-coral text-center max-w-xl">
        <p className="font-semibold text-muted mb-4">{error ?? 'Terjadi kesalahan'}</p>
        {backButton}
      </div>
    );
  }

  const joined = new Date(data.joinedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const badges = computeBadges({
    missionsCompleted: data.missionsCompleted,
    longestStreak: data.longestStreak,
    petHatched: Boolean(data.pet?.hatchedAt),
    globalRank: data.globalRank,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>{backButton}</div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 border-2 border-ink bg-cream-2 flex items-center justify-center shrink-0 overflow-hidden">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold">{data.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{data.username}</h1>
          <p className="text-sm text-muted font-semibold">Bergabung sejak {joined}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Ranking Global', value: `#${data.globalRank}` },
          { label: 'Streak Saat Ini', value: `${data.currentStreak} 🔥` },
          { label: 'Misi Selesai', value: `${data.missionsCompleted}` },
          { label: 'Total Poin', value: data.totalPoints.toLocaleString('id-ID') },
        ].map(({ label, value }) => (
          <div key={label} className={cardClass}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-1">{label}</p>
            <p className="text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      {data.pet && (
        <div className={cardClass}>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-3">Pet</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{petEmoji(data.pet.stage, null)}</span>
            <div>
              <p className="font-extrabold">
                {data.pet.stage === 'EGG' ? 'Telur Misterius' : data.pet.name}
              </p>
              <span
                className={cn(
                  'inline-block px-2 py-0.5 text-xs font-extrabold border border-ink',
                  RARITY_STYLES[data.pet.rarity],
                )}
              >
                {data.pet.rarity}
              </span>
              <p className="text-sm text-muted font-semibold mt-1">
                Stage: {STAGE_LABELS[data.pet.stage]}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-3">
          Badge & Achievement
        </p>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {badges.map(({ emoji, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 border-2 border-ink bg-lime-100"
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-xs font-extrabold">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted font-semibold">Belum ada badge.</p>
        )}
      </div>
    </div>
  );
}
