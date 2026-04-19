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
  onComplete: (userMissionId: string) => void;
}

export default function MissionCard({ userMission, apiBaseUrl = '', onComplete }: MissionCardProps) {
  const { mission, status, proofUrl } = userMission;
  const isVerified = status === 'VERIFIED';
  const isCompleted = status === 'COMPLETED' || isVerified;

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
          <button
            onClick={() => onComplete(userMission.id)}
            className="w-full py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-100"
          >
            Selesaikan →
          </button>
        )}
      </div>
    </div>
  );
}
