import { Link } from 'react-router-dom';
import { useReport, petEmoji, RARITY_STYLES, STAGE_LABELS } from '../features/profile/useReport';
import { computeBadges } from '../features/profile/badges';
import { cn } from '../lib/cn';

const cardClass = 'border-2 border-ink p-5 shadow-hard bg-cream';

export default function Profile() {
  const { data, loading, error } = useReport();

  if (loading) return <p className="text-muted font-semibold">Memuat profil...</p>;
  if (error || !data) return <p className="text-coral font-semibold">{error ?? 'Terjadi kesalahan'}</p>;

  const { user, pet, globalRank, missionsCompleted, ownedItems, activeEvent } = data;
  const joined = new Date(user.joinedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const badges = computeBadges({
    missionsCompleted,
    longestStreak: user.longestStreak,
    petHatched: Boolean(pet?.hatchedAt),
    globalRank,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{user.username}</h1>
          <p className="text-sm text-muted font-semibold">Bergabung sejak {joined}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/report"
            className="px-4 py-2 text-sm font-extrabold border-2 border-ink bg-lime-100 shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            📊 Daily Report
          </Link>
          <Link
            to="/feedback"
            className="px-4 py-2 text-sm font-extrabold border-2 border-ink bg-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            💬 Feedback
          </Link>
        </div>
      </div>

      {activeEvent && (
        <div className="border-2 border-ink bg-amber-100 px-4 py-3 shadow-hard-sm">
          <p className="font-extrabold text-sm">
            ⚡ {activeEvent.title} sedang berlangsung — EXP ×{activeEvent.expMultiplier}!
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Ranking Global', value: `#${globalRank}` },
          { label: 'Streak Saat Ini', value: `${user.currentStreak} 🔥` },
          { label: 'Streak Tertinggi', value: `${user.longestStreak}` },
          { label: 'Total EXP', value: `${user.exp}` },
        ].map(({ label, value }) => (
          <div key={label} className={cardClass}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-1">{label}</p>
            <p className="text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className={cardClass}>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-3">Pet Kamu</p>
          {pet ? (
            <div className="flex items-center gap-4">
              <span className="text-6xl">{petEmoji(pet.stage, user.gender)}</span>
              <div>
                <p className="font-extrabold">{pet.stage === 'EGG' ? 'Telur Misterius' : pet.name}</p>
                <span
                  className={cn(
                    'inline-block px-2 py-0.5 text-xs font-extrabold border border-ink',
                    RARITY_STYLES[pet.rarity],
                  )}
                >
                  {pet.rarity}
                </span>
                <p className="text-sm text-muted font-semibold mt-1">
                  Stage: {STAGE_LABELS[pet.stage]} · {pet.exp} EXP
                  {pet.nextStageExp !== null && ` / ${pet.nextStageExp}`}
                </p>
                {pet.nextStageExp !== null && (
                  <div className="mt-2 h-2 w-40 border border-ink bg-cream-2">
                    <div
                      className="h-full bg-ink"
                      style={{ width: `${Math.min(100, (pet.exp / pet.nextStageExp) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted font-semibold">
              Belum ada pet.{' '}
              <Link to="/onboarding" className="underline font-extrabold">
                Selesaikan onboarding
              </Link>{' '}
              untuk mendapatkan telur!
            </p>
          )}
        </div>

        <div className={cardClass}>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-3">
            Koleksi ({ownedItems.length})
          </p>
          {ownedItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {ownedItems.map((item) => (
                <span key={item.id} className="px-2 py-1 text-xs font-bold border-2 border-ink bg-cream-2">
                  {item.title}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted font-semibold">
              Belum ada item. Kunjungi{' '}
              <Link to="/shop" className="underline font-extrabold">
                Shop
              </Link>{' '}
              untuk membeli emote, outfit, dan cosmetic.
            </p>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-3">
          Badge & Achievement
        </p>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {badges.map(({ emoji, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 border-2 border-ink bg-lime-100">
                <span className="text-xl">{emoji}</span>
                <span className="text-xs font-extrabold">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted font-semibold">Selesaikan misi untuk membuka badge pertamamu!</p>
        )}
      </div>
    </div>
  );
}
