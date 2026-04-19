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
        'rounded-xl border p-4 space-y-3 transition-colors',
        'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
        isVerified && 'border-green-400 dark:border-green-600',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            {CATEGORY_ICON[mission.category]}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {CATEGORY_LABEL[mission.category]}
          </span>
        </div>
        <span className="text-sm font-semibold text-brand-600">+{mission.points} pts</span>
      </div>

      <div>
        <h3 className="font-semibold text-sm">{mission.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mission.description}</p>
      </div>

      {isVerified && proofUrl && (
        <div className="space-y-2">
          <img
            src={`${apiBaseUrl}${proofUrl}`}
            alt="Bukti misi"
            className="w-full h-32 object-cover rounded-lg"
          />
          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <span>✓</span>
            <span>Misi selesai · +{userMission.pointsEarned} poin</span>
          </div>
        </div>
      )}

      {!isCompleted && (
        <button
          onClick={() => onComplete(userMission.id)}
          className={cn(
            'w-full py-2 rounded-lg text-sm font-medium text-white transition-colors',
            'bg-brand-600 hover:bg-brand-700',
          )}
        >
          Selesaikan
        </button>
      )}
    </div>
  );
}
