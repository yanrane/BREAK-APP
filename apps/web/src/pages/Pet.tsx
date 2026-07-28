import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReport, petEmoji, RARITY_STYLES, STAGE_LABELS } from '../features/profile/useReport';
import {
  petLevel,
  expForLevel,
  allMilestones,
  prestigeInfo,
  MAX_REWARD_LEVEL,
} from '../features/pet/petLevel';
import { AVATARS, avatarDataUri, type Avatar } from '../features/pet/avatars';
import api from '../lib/api';
import { cn } from '../lib/cn';

const cardClass = 'border-2 border-ink p-5 shadow-hard bg-cream';

export default function Pet() {
  const { data, loading, error, refetch } = useReport();
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  async function chooseAvatar(avatar: Avatar) {
    setSavingAvatar(avatar.id);
    setAvatarError(null);
    try {
      await api.patch('/me/avatar', { avatarId: avatar.id });
      await refetch();
    } catch {
      setAvatarError('Gagal menyimpan avatar. Coba lagi.');
    } finally {
      setSavingAvatar(null);
    }
  }

  if (loading) return <div className="h-72 border-2 border-ink/20 bg-cream-2 animate-pulse max-w-2xl" />;
  if (error || !data) return <p className="text-coral font-semibold">{error ?? 'Terjadi kesalahan'}</p>;

  const { user, pet } = data;

  if (!pet) {
    return (
      <div className="border-2 border-ink p-10 shadow-hard text-center max-w-xl">
        <p className="text-5xl mb-4">🥚</p>
        <p className="font-extrabold text-lg mb-2">Belum ada pet</p>
        <p className="text-sm text-muted font-semibold mb-4">
          Selesaikan onboarding untuk mendapatkan telur pertamamu.
        </p>
        <Link to="/onboarding" className="text-sm font-extrabold underline decoration-lime decoration-2">
          Ke Onboarding →
        </Link>
      </div>
    );
  }

  const level = petLevel(pet.exp);
  const currentBase = expForLevel(level);
  const nextNeed = expForLevel(level + 1);
  const progress = Math.min(100, ((pet.exp - currentBase) / (nextNeed - currentBase)) * 100);
  const prestige = prestigeInfo(level);
  const milestones = allMilestones();
  const nextMilestone = milestones.find((m) => m.level > pet.lastRewardLevel);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-label mb-1">Pet Companion</p>
          <h1 className="text-4xl font-extrabold leading-none tracking-tight">
            {pet.stage === 'EGG' ? 'Telur Misterius' : pet.name}
          </h1>
        </div>
        <Link
          to="/profile"
          className="text-sm font-extrabold underline decoration-lime decoration-2 hover:text-muted transition-colors"
        >
          ← Profil
        </Link>
      </div>

      {/* Kartu utama pet */}
      <div className={cn(cardClass, 'flex items-center gap-6 flex-wrap')}>
        <span className="text-8xl" aria-hidden="true">
          {petEmoji(pet.stage, user.gender)}
        </span>
        <div className="flex-1 min-w-[220px] space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-3xl font-extrabold">Lv {level}</span>
            <span
              className={cn('px-2 py-0.5 text-xs font-extrabold border border-ink', RARITY_STYLES[pet.rarity])}
            >
              {pet.rarity}
            </span>
            {prestige.tier > 0 && (
              <span className="px-2 py-0.5 text-xs font-extrabold border-2 border-ink bg-ink text-lime">
                ★ Prestige {'I'.repeat(Math.min(prestige.tier, 3))} — {prestige.title}
              </span>
            )}
          </div>
          <p className="text-sm text-muted font-semibold">
            Stage {STAGE_LABELS[pet.stage]} · {pet.exp.toLocaleString('id-ID')} EXP total
          </p>
          {/* XP bar ke level berikutnya */}
          <div>
            <div className="h-4 border-2 border-ink bg-cream-2">
              <div
                className="h-full bg-lime transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-bold text-muted mt-1">
              {(pet.exp - currentBase).toLocaleString('id-ID')} /{' '}
              {(nextNeed - currentBase).toLocaleString('id-ID')} EXP ke Lv {level + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Avatar profil — terbuka mengikuti level pet */}
      <div className={cardClass}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-1">
          Avatar Profil
        </p>
        <p className="text-sm text-muted font-semibold mb-3">
          Terbuka otomatis saat level pet naik. Dipakai di leaderboard dan profil publikmu.
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {AVATARS.map((a) => {
            const locked = level < a.level;
            const active = user.avatarUrl === avatarDataUri(a.emoji);
            return (
              <button
                key={a.id}
                onClick={() => chooseAvatar(a)}
                disabled={locked || savingAvatar !== null}
                title={locked ? `Terbuka di Lv ${a.level}` : a.label}
                className={cn(
                  'aspect-square border-2 border-ink flex flex-col items-center justify-center gap-0.5 transition-colors',
                  active && 'bg-lime',
                  locked && 'bg-cream-2 opacity-50 cursor-not-allowed',
                  !locked && !active && 'bg-cream hover:bg-lime-100',
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {locked ? '🔒' : a.emoji}
                </span>
                <span className="text-[10px] font-extrabold leading-none">
                  {locked ? `Lv ${a.level}` : a.label}
                </span>
              </button>
            );
          })}
        </div>
        {avatarError && <p className="text-coral text-sm font-semibold mt-2">{avatarError}</p>}
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Level', value: `${level}` },
          { label: 'Total EXP', value: pet.exp.toLocaleString('id-ID') },
          {
            label: 'Prestige',
            value: prestige.tier > 0 ? `Tier ${prestige.tier}` : `Lv ${prestige.nextAt}`,
            sub: prestige.tier > 0 ? undefined : 'menuju Prestige I',
          },
          {
            label: 'Milestone',
            value: `${milestones.filter((m) => m.level <= pet.lastRewardLevel).length}/${milestones.length}`,
          },
        ].map(({ label, value, sub }) => (
          <div key={label} className={cardClass}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-1">{label}</p>
            <p className="text-2xl font-extrabold">{value}</p>
            {sub && <p className="text-xs text-muted font-semibold">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Milestone rewards */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
            Milestone Rewards (sampai Lv {MAX_REWARD_LEVEL})
          </p>
          {nextMilestone && (
            <p className="text-xs font-extrabold">
              Berikutnya: Lv {nextMilestone.level}
            </p>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-ink/15 border-2 border-ink">
          {milestones.map((m) => {
            const claimed = m.level <= pet.lastRewardLevel;
            const isNext = nextMilestone?.level === m.level;
            return (
              <div
                key={m.level}
                className={cn(
                  'flex items-center gap-3 px-3 py-2',
                  claimed ? 'bg-lime/40' : isNext ? 'bg-amber-100' : 'bg-cream',
                  !claimed && !isNext && !m.major && 'opacity-60',
                )}
              >
                <span className="w-14 shrink-0 text-xs font-extrabold">Lv {m.level}</span>
                <span className={cn('flex-1 text-sm', m.major ? 'font-extrabold' : 'font-semibold text-muted')}>
                  {claimed ? '✅' : isNext ? '🎯' : '🔒'} {m.label}
                </span>
                <span className="text-xs font-extrabold shrink-0">🪙 {m.coins}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted font-semibold mt-3">
          Setelah Lv {MAX_REWARD_LEVEL}, level terus naik tanpa batas sebagai{' '}
          <span className="font-extrabold">Prestige</span> — Prestige I di Lv 500, II di Lv 1000,
          III di Lv 2000. Murni gengsi, bukan pay-to-win. 😎
        </p>
      </div>
    </div>
  );
}
