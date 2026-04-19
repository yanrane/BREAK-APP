import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/cn';
import api from '../../lib/api';

type GamePhase = 'idle' | 'waiting' | 'ready' | 'roundResult' | 'sessionResult' | 'submitted';

interface RoundResult {
  reactionMs: number;
  score: number;
}

interface GameScoreResponse {
  id: string;
  score: number;
  pointsEarned: number;
  playedAt: string;
}

const TOTAL_ROUNDS = 5;
const WAIT_MIN_MS = 2000;
const WAIT_MAX_MS = 6000;

function estimatePoints(avgScore: number): number {
  if (avgScore >= 800) return 5;
  if (avgScore >= 600) return 4;
  if (avgScore >= 400) return 3;
  if (avgScore >= 200) return 2;
  return 1;
}

export default function ReactionGame() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [tooEarly, setTooEarly] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<GameScoreResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const readyTimestamp = useRef<number>(0);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (waitTimer.current) clearTimeout(waitTimer.current);
    };
  }, []);

  const startRound = () => {
    setTooEarly(false);
    setLastResult(null);
    setPhase('waiting');
    const delay = WAIT_MIN_MS + Math.random() * (WAIT_MAX_MS - WAIT_MIN_MS);
    waitTimer.current = setTimeout(() => {
      readyTimestamp.current = Date.now();
      setPhase('ready');
    }, delay);
  };

  const handleAreaClick = () => {
    if (phase === 'waiting') {
      if (waitTimer.current) clearTimeout(waitTimer.current);
      setTooEarly(true);
      setPhase('roundResult');
      return;
    }
    if (phase === 'ready') {
      const reactionMs = Date.now() - readyTimestamp.current;
      const score = Math.max(0, Math.min(1000, 1000 - reactionMs));
      const result: RoundResult = { reactionMs, score };
      setLastResult(result);
      setRounds((prev) => [...prev, result]);
      setPhase('roundResult');
    }
  };

  const handleNextRound = () => {
    if (tooEarly) {
      startRound();
      return;
    }
    if (rounds.length >= TOTAL_ROUNDS) {
      setPhase('sessionResult');
    } else {
      startRound();
    }
  };

  const handleSubmit = async (avgScore: number) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const res = await api.post<{ success: true; data: GameScoreResponse }>(
        '/games/submit',
        { gameType: 'REACTION', score: avgScore },
      );
      setSubmitResult(res.data.data);
      setPhase('submitted');
    } catch {
      setSubmitError('Gagal menyimpan skor. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (waitTimer.current) clearTimeout(waitTimer.current);
    setPhase('idle');
    setRounds([]);
    setLastResult(null);
    setTooEarly(false);
    setSubmitResult(null);
    setSubmitError(null);
  };

  const avgScore = rounds.length > 0
    ? Math.round(rounds.reduce((s, r) => s + r.score, 0) / rounds.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Idle */}
      {phase === 'idle' && (
        <div className="text-center space-y-4 py-8">
          <p className="text-5xl">⚡</p>
          <div>
            <h3 className="font-bold text-lg">Reaction Time</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Klik secepat mungkin saat layar berubah hijau. {TOTAL_ROUNDS} ronde.
            </p>
          </div>
          <button
            onClick={startRound}
            className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors"
          >
            Mulai
          </button>
        </div>
      )}

      {/* Click target area — waiting or ready */}
      {(phase === 'waiting' || phase === 'ready') && (
        <>
          <div
            onClick={handleAreaClick}
            role="button"
            tabIndex={0}
            aria-label={phase === 'waiting' ? 'Area klik — tunggu dulu' : 'Klik sekarang!'}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleAreaClick()}
            className={cn(
              'w-full h-64 rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-colors',
              phase === 'waiting' && 'bg-gray-200 dark:bg-gray-700',
              phase === 'ready' && 'bg-green-400 dark:bg-green-500',
            )}
          >
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
              {phase === 'waiting' ? 'Tunggu...' : 'KLIK!'}
            </p>
            {phase === 'waiting' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Jangan klik dulu</p>
            )}
          </div>
          {/* Round progress */}
          <div className="flex gap-2 justify-center">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  i < rounds.length ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700',
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Round result */}
      {phase === 'roundResult' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center space-y-3">
          {tooEarly ? (
            <>
              <p className="text-3xl">⚠️</p>
              <p className="font-bold text-lg">Terlalu cepat!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ronde ini tidak dihitung.</p>
            </>
          ) : (
            <>
              <p className="text-3xl">✅</p>
              <p className="font-bold text-2xl">{lastResult?.reactionMs} ms</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Skor: {Math.round(lastResult?.score ?? 0)} · Ronde {rounds.length}/{TOTAL_ROUNDS}
              </p>
            </>
          )}
          <button
            onClick={handleNextRound}
            className="mt-2 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            {tooEarly
              ? 'Ulangi Ronde'
              : rounds.length >= TOTAL_ROUNDS
              ? 'Lihat Hasil'
              : 'Ronde Berikutnya'}
          </button>
        </div>
      )}

      {/* Session result */}
      {phase === 'sessionResult' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
          <h3 className="font-bold text-lg text-center">Hasil Sesi</h3>
          <div className="space-y-2">
            {rounds.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">Ronde {i + 1}</span>
                <span>{r.reactionMs} ms · skor {Math.round(r.score)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
            <div className="flex justify-between font-semibold text-sm">
              <span>Rata-rata skor</span>
              <span>{avgScore}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-600">
              <span>Estimasi poin</span>
              <span>+{estimatePoints(avgScore)} pts (tergantung cap harian)</span>
            </div>
          </div>
          {submitError && <p className="text-red-500 text-sm text-center">{submitError}</p>}
          <button
            onClick={() => handleSubmit(avgScore)}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Menyimpan...' : 'Kirim & Simpan'}
          </button>
        </div>
      )}

      {/* Submitted */}
      {phase === 'submitted' && submitResult && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center space-y-3">
          <p className="text-4xl">{submitResult.pointsEarned > 0 ? '🎉' : '😮'}</p>
          {submitResult.pointsEarned > 0 ? (
            <>
              <p className="font-bold text-lg">+{submitResult.pointsEarned} poin!</p>
              <p className="text-sm text-gray-500">Rata-rata skor: {avgScore}</p>
            </>
          ) : (
            <>
              <p className="font-bold">Poin harian sudah maksimal</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kamu sudah capai 20 poin dari game hari ini. Tetap bagus! Coba lagi besok.
              </p>
            </>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Main Lagi
          </button>
        </div>
      )}
    </div>
  );
}
