import type { GameScoreResult } from './gameApi';

interface GameResultCardProps {
  result: GameScoreResult | null;
  submitting: boolean;
  error: string | null;
  onRetry: () => void;
  retryLabel?: string;
  children?: React.ReactNode;
}

/** Panel hasil akhir game: skor, poin masuk, dan tombol main lagi. */
export default function GameResultCard({
  result,
  submitting,
  error,
  onRetry,
  retryLabel = '↺ Main Lagi',
  children,
}: GameResultCardProps) {
  return (
    <div className="border-2 border-ink p-6 shadow-hard bg-cream text-center space-y-4">
      {children}

      {submitting && <p className="text-sm text-muted font-semibold">Menyimpan skor...</p>}

      {result && (
        <div className="space-y-1">
          <p className="text-5xl font-extrabold">{result.score}</p>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Skor</p>
          <p className="text-sm font-extrabold mt-2">
            {result.pointsEarned > 0 ? (
              <span className="bg-lime px-2 py-0.5">+{result.pointsEarned} poin masuk!</span>
            ) : (
              <span className="text-muted">Cap poin game harian sudah tercapai (20/hari)</span>
            )}
          </p>
        </div>
      )}

      {error && <p className="text-coral text-sm font-bold">{error}</p>}

      <button
        onClick={onRetry}
        className="px-6 py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
      >
        {retryLabel}
      </button>
    </div>
  );
}
