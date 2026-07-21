import { useEffect, useRef, useState } from 'react';
import { submitGameScore, type GameScoreResult } from './gameApi';
import GameResultCard from './GameResultCard';

const DURATION_S = 10;
// ~7 CPS (70 klik) = skor 840 — pemain cepat bisa tembus 1000
const SCORE_PER_CLICK = 12;

type Phase = 'idle' | 'running' | 'finished';

export default function FastClickGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION_S);
  const [result, setResult] = useState<GameScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endAtRef = useRef(0);

  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      const left = Math.max(0, (endAtRef.current - Date.now()) / 1000);
      setTimeLeft(left);
      if (left <= 0) setPhase('finished');
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // Submit sekali saat selesai
  useEffect(() => {
    if (phase !== 'finished') return;
    setSubmitting(true);
    setError(null);
    submitGameScore('FAST_CLICK', Math.min(1000, clicks * SCORE_PER_CLICK))
      .then(setResult)
      .catch(() => setError('Gagal menyimpan skor. Coba lagi.'))
      .finally(() => setSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = () => {
    setClicks(0);
    setResult(null);
    setError(null);
    setTimeLeft(DURATION_S);
    endAtRef.current = Date.now() + DURATION_S * 1000;
    setPhase('running');
  };

  if (phase === 'finished') {
    return (
      <GameResultCard result={result} submitting={submitting} error={error} onRetry={start}>
        <p className="font-extrabold text-lg">
          {clicks} klik dalam {DURATION_S} detik ({(clicks / DURATION_S).toFixed(1)} CPS)
        </p>
      </GameResultCard>
    );
  }

  return (
    <div className="border-2 border-ink shadow-hard bg-cream">
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-widest">
          {phase === 'running' ? `⏱ ${timeLeft.toFixed(1)}s` : `${DURATION_S} detik`}
        </span>
        <span className="text-sm font-extrabold bg-ink text-cream px-2 py-0.5">{clicks} klik</span>
      </div>
      <div className="p-4">
        {phase === 'idle' ? (
          <button
            onClick={start}
            className="w-full py-16 text-lg font-extrabold border-2 border-ink bg-lime shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            ▶ Mulai — klik secepat mungkin!
          </button>
        ) : (
          <button
            onClick={() => setClicks((c) => c + 1)}
            className="w-full py-16 text-2xl font-extrabold border-2 border-ink bg-coral text-cream select-none active:bg-ink transition-colors duration-75"
          >
            KLIK! 👆
          </button>
        )}
      </div>
    </div>
  );
}
