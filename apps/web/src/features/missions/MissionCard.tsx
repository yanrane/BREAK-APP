import { cn } from '../../lib/cn';
import type { UserMission } from './useMissions';

const CATEGORY_ICON: Record<string, string> = {
  PHYSICAL: '🏃',
  MENTAL: '🧠',
  SOCIAL: '🤝',
  CREATIVE: '🎨',
};

const CATEGORY_LABEL: Record<string, string> = {
  PHYSICAL: 'Fisik',
  MENTAL: 'Mental',
  SOCIAL: 'Sosial',
  CREATIVE: 'Kreatif',
};

interface MissionCardProps {
  userMission: UserMission;
  apiBaseUrl?: string;
  onStart: (userMissionId: string) => void;
}

// Jendela jam mulai misi (jam lokal device) — server memvalidasi ulang, ini hanya UX
const START_OPEN_HOUR = 4;
const START_CLOSE_HOUR = 19;

export default function MissionCard({ userMission, apiBaseUrl = '', onStart }: MissionCardProps) {
  const { mission, status, proofUrl } = userMission;
  const isVerified = status === 'VERIFIED';
  const isCompleted = status === 'COMPLETED' || isVerified;
  const isInProgress = status === 'IN_PROGRESS';

  const hour = new Date().getHours();
  const beforeOpen = hour < START_OPEN_HOUR;
  const afterClose = hour >= START_CLOSE_HOUR;
  // Sesi IN_PROGRESS boleh dilanjutkan kapan pun — jendela hanya membatasi start baru
  const startBlocked = !isInProgress && (beforeOpen || afterClose);

  return (
    <div
      className={cn(
        'border-2 border-ink shadow-hard transition-all duration-150',
        isVerified ? 'bg-lime' : 'bg-cream',
      )}
    >
      {/* Top stripe for category */}
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{CATEGORY_ICON[mission.category]}</span>
          <span className="text-xs font-extrabold uppercase tracking-widest">
            {CATEGORY_LABEL[mission.category]}
          </span>
        </div>
        <span className="text-sm font-extrabold bg-ink text-cream px-2 py-0.5">
          +{mission.points} pts
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-extrabold text-base leading-tight">{mission.title}</h3>
          <p className="text-sm text-muted font-medium mt-1 leading-relaxed">{mission.description}</p>
        </div>

        {isVerified && userMission.gpsDistanceM !== null && (
          <div className="flex items-center gap-2 text-ink text-xs font-extrabold">
            <span className="bg-ink text-lime px-1.5 py-0.5">✓ SELESAI</span>
            <span>📍 {(userMission.gpsDistanceM / 1000).toFixed(2)} km via GPS</span>
            <span>+{userMission.pointsEarned} poin</span>
          </div>
        )}

        {isVerified && proofUrl && (
          <div className="space-y-2">
            <img
              src={`${apiBaseUrl}${proofUrl}`}
              alt="Bukti misi"
              className="w-full h-40 object-cover border-2 border-ink"
            />
            <div className="flex items-center gap-2 text-ink text-xs font-extrabold">
              <span className="bg-ink text-lime px-1.5 py-0.5">✓ SELESAI</span>
              <span>+{userMission.pointsEarned} poin earned</span>
            </div>
          </div>
        )}

        {isCompleted && !isVerified && (
          <div className="border-2 border-ink px-3 py-2 bg-cream-2">
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
              Menunggu verifikasi
            </p>
          </div>
        )}

        {!isCompleted && (
          <div className="space-y-2">
            <button
              onClick={() => onStart(userMission.id)}
              disabled={startBlocked}
              className={cn(
                'w-full py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream transition-all duration-100',
                startBlocked
                  ? 'opacity-40 cursor-not-allowed'
                  : 'shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px]',
              )}
            >
              {isInProgress ? 'Lanjutkan Sesi →' : '▶ Start Mission'}
            </button>
            {startBlocked && (
              <p className="text-xs font-bold text-muted leading-snug">
                {beforeOpen
                  ? '⏰ Misi belum dibuka. Kamu bisa mulai pukul 04:00–19:00.'
                  : '🌙 Pendaftaran misi hari ini sudah ditutup. Mulai lagi besok pukul 04:00.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
