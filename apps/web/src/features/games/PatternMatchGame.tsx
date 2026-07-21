import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { submitGameScore, type GameScoreResult } from './gameApi';
import GameResultCard from './GameResultCard';

const GRID = 16; // 4x4
const START_LEN = 3;
const FLASH_MS = 550;
const SCORE_PER_LEVEL = 100;

type Phase = 'idle' | 'showing' | 'input' | 'gameover';

export default function PatternMatchGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [flashIndex, setFlashIndex] = useState(-1); // index dalam sequence yang sedang menyala
  const [inputPos, setInputPos] = useState(0);
  const [level, setLevel] = useState(1);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [result, setResult] = useState<GameScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const playSequence = (seq: number[]) => {
    setPhase('showing');
    setFlashIndex(-1);
    seq.forEach((_, i) => {
      timers.current.push(setTimeout(() => setFlashIndex(i), i * FLASH_MS));
      timers.current.push(setTimeout(() => setFlashIndex(-1), i * FLASH_MS + FLASH_MS - 150));
    });
    timers.current.push(
      setTimeout(() => {
        setInputPos(0);
        setPhase('input');
      }, seq.length * FLASH_MS),
    );
  };

  const startLevel = (lvl: number, prevSeq: number[]) => {
    const seq =
      lvl === 1
        ? Array.from({ length: START_LEN }, () => Math.floor(Math.random() * GRID))
        : [...prevSeq, Math.floor(Math.random() * GRID)];
    setLevel(lvl);
    setSequence(seq);
    setWrongCell(null);
    playSequence(seq);
  };

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResult(null);
    setError(null);
    startLevel(1, []);
  };

  const finish = (completedLevels: number) => {
    setPhase('gameover');
    setSubmitting(true);
    submitGameScore('PATTERN_MATCH', Math.min(1000, completedLevels * SCORE_PER_LEVEL))
      .then(setResult)
      .catch(() => setError('Gagal menyimpan skor. Coba lagi.'))
      .finally(() => setSubmitting(false));
  };

  const handleCell = (cell: number) => {
    if (phase !== 'input') return;
    if (cell === sequence[inputPos]) {
      const next = inputPos + 1;
      if (next >= sequence.length) {
        // Level selesai — lanjut dengan sequence lebih panjang
        timers.current.push(setTimeout(() => startLevel(level + 1, sequence), 600));
        setPhase('showing');
        setFlashIndex(-1);
      } else {
        setInputPos(next);
      }
    } else {
      setWrongCell(cell);
      finish(level - 1);
    }
  };

  if (phase === 'gameover') {
    return (
      <GameResultCard result={result} submitting={submitting} error={error} onRetry={start}>
        <p className="font-extrabold text-lg">
          Sampai level {level} — {level - 1} pola berhasil dihafal
        </p>
      </GameResultCard>
    );
  }

  return (
    <div className="border-2 border-ink shadow-hard bg-cream">
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-widest">
          {phase === 'idle' && 'Hafal urutan kotak yang menyala'}
          {phase === 'showing' && '👀 Perhatikan...'}
          {phase === 'input' && `✋ Ulangi! (${inputPos}/${sequence.length})`}
        </span>
        <span className="text-sm font-extrabold bg-ink text-cream px-2 py-0.5">Lv {level}</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: GRID }, (_, cell) => (
            <button
              key={cell}
              onClick={() => handleCell(cell)}
              disabled={phase !== 'input'}
              className={cn(
                'aspect-square border-2 border-ink transition-colors duration-100',
                flashIndex >= 0 && sequence[flashIndex] === cell
                  ? 'bg-lime'
                  : wrongCell === cell
                    ? 'bg-coral'
                    : 'bg-cream-2',
                phase === 'input' && 'hover:bg-cream active:bg-lime cursor-pointer',
              )}
              aria-label={`Kotak ${cell + 1}`}
            />
          ))}
        </div>
        {phase === 'idle' && (
          <button
            onClick={start}
            className="w-full py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            ▶ Mulai
          </button>
        )}
      </div>
    </div>
  );
}
