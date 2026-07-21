import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { submitGameScore, type GameScoreResult } from './gameApi';
import GameResultCard from './GameResultCard';

const EMOJIS = ['🍎', '🚀', '🎸', '🐢', '🌵', '⚽', '🎲', '🔑'];
const PAIRS = EMOJIS.length;

type Phase = 'idle' | 'playing' | 'finished';

interface Card {
  emoji: string;
  matched: boolean;
}

function buildDeck(): Card[] {
  const deck = [...EMOJIS, ...EMOJIS].map((emoji) => ({ emoji, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Skor: sempurna 8 percobaan & cepat = 1000, penalti per percobaan ekstra & waktu. */
function computeScore(attempts: number, seconds: number): number {
  return Math.max(100, Math.min(1000, 1000 - (attempts - PAIRS) * 40 - Math.floor(seconds) * 2));
}

export default function MemoryGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]); // indeks kartu terbuka (maks 2)
  const [attempts, setAttempts] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<GameScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    setDeck(buildDeck());
    setOpen([]);
    setAttempts(0);
    setSeconds(0);
    setResult(null);
    setError(null);
    setPhase('playing');
  };

  const finish = (finalAttempts: number, finalSeconds: number) => {
    setPhase('finished');
    setSubmitting(true);
    submitGameScore('MEMORY', computeScore(finalAttempts, finalSeconds))
      .then(setResult)
      .catch(() => setError('Gagal menyimpan skor. Coba lagi.'))
      .finally(() => setSubmitting(false));
  };

  const flip = (idx: number) => {
    if (phase !== 'playing' || deck[idx].matched || open.includes(idx) || open.length >= 2) return;

    const nextOpen = [...open, idx];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    const [a, b] = nextOpen;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (deck[a].emoji === deck[b].emoji) {
      const newDeck = deck.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
      setDeck(newDeck);
      setOpen([]);
      if (newDeck.every((c) => c.matched)) finish(newAttempts, seconds);
    } else {
      closeTimer.current = setTimeout(() => setOpen([]), 700);
    }
  };

  if (phase === 'finished') {
    return (
      <GameResultCard result={result} submitting={submitting} error={error} onRetry={start}>
        <p className="font-extrabold text-lg">
          {PAIRS} pasang selesai — {attempts} percobaan, {seconds} detik
        </p>
      </GameResultCard>
    );
  }

  return (
    <div className="border-2 border-ink shadow-hard bg-cream">
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-widest">
          {phase === 'idle' ? 'Temukan semua pasangan kartu' : `⏱ ${seconds}s`}
        </span>
        <span className="text-sm font-extrabold bg-ink text-cream px-2 py-0.5">
          {attempts} percobaan
        </span>
      </div>
      <div className="p-4 space-y-4">
        {phase === 'idle' ? (
          <button
            onClick={start}
            className="w-full py-16 text-lg font-extrabold border-2 border-ink bg-lime shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            ▶ Mulai
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {deck.map((card, idx) => {
              const revealed = card.matched || open.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => flip(idx)}
                  className={cn(
                    'aspect-square border-2 border-ink text-2xl sm:text-3xl flex items-center justify-center transition-colors duration-150 select-none',
                    card.matched ? 'bg-lime' : revealed ? 'bg-cream' : 'bg-ink text-cream hover:bg-ink/80',
                  )}
                  aria-label={revealed ? card.emoji : 'Kartu tertutup'}
                >
                  {revealed ? card.emoji : '?'}
                  {!revealed && <span className="sr-only">tertutup</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
