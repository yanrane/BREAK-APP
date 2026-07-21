import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';
import { mulberry32, todaySeed, submitGameScore, type GameScoreResult } from './gameApi';
import GameResultCard from './GameResultCard';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type Phase = 'menu' | 'playing' | 'finished';

const GIVENS: Record<Difficulty, number> = { EASY: 40, MEDIUM: 32, HARD: 26 };
const BASE_SCORE: Record<Difficulty, number> = { EASY: 600, MEDIUM: 800, HARD: 1000 };
const DIFF_LABEL: Record<Difficulty, string> = { EASY: 'Mudah', MEDIUM: 'Sedang', HARD: 'Sulit' };

type Grid = number[][]; // 0 = kosong

function shuffled(arr: number[], rand: () => number): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(grid: Grid, row: number, col: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === val || grid[i][col] === val) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === val) return false;
    }
  }
  return true;
}

/** Isi grid penuh dengan backtracking + kandidat teracak (seeded). */
function fillGrid(grid: Grid, rand: () => number): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== 0) continue;
      for (const val of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rand)) {
        if (canPlace(grid, row, col, val)) {
          grid[row][col] = val;
          if (fillGrid(grid, rand)) return true;
          grid[row][col] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/**
 * Buat puzzle dari solusi penuh dengan menghapus sel acak.
 * ponytail: tanpa cek solusi-unik (mahal) — cukup untuk casual play,
 * upgrade ke uniqueness check kalau user komplain multi-solusi.
 */
function makePuzzle(seed: number, difficulty: Difficulty): { puzzle: Grid; solution: Grid } {
  const rand = mulberry32(seed);
  const solution: Grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(solution, rand);

  const puzzle = solution.map((row) => [...row]);
  const holes = 81 - GIVENS[difficulty];
  const cells = shuffled(Array.from({ length: 81 }, (_, i) => i), rand).slice(0, holes);
  for (const cell of cells) {
    puzzle[Math.floor(cell / 9)][cell % 9] = 0;
  }
  return { puzzle, solution };
}

function computeScore(difficulty: Difficulty, mistakes: number, seconds: number): number {
  return Math.max(
    100,
    Math.min(1000, BASE_SCORE[difficulty] - mistakes * 50 - Math.floor(seconds / 60) * 15),
  );
}

export default function SudokuGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isDaily, setIsDaily] = useState(false);
  const [puzzle, setPuzzle] = useState<Grid>([]);
  const [solution, setSolution] = useState<Grid>([]);
  const [board, setBoard] = useState<Grid>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<GameScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = (diff: Difficulty, daily: boolean) => {
    // Tantangan harian: seed dari tanggal → puzzle sama untuk semua orang hari itu
    const seed = daily ? todaySeed() : Math.floor(Math.random() * 2 ** 31);
    const { puzzle: p, solution: s } = makePuzzle(seed, diff);
    setDifficulty(diff);
    setIsDaily(daily);
    setPuzzle(p);
    setSolution(s);
    setBoard(p.map((row) => [...row]));
    setSelected(null);
    setMistakes(0);
    setSeconds(0);
    setResult(null);
    setError(null);
    setPhase('playing');
  };

  const finish = (finalMistakes: number) => {
    setPhase('finished');
    setSubmitting(true);
    submitGameScore('SUDOKU', computeScore(difficulty, finalMistakes, seconds))
      .then(setResult)
      .catch(() => setError('Gagal menyimpan skor. Coba lagi.'))
      .finally(() => setSubmitting(false));
  };

  const place = (val: number) => {
    if (!selected || phase !== 'playing') return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0) return; // sel bawaan tidak bisa diubah

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = val;
    setBoard(newBoard);

    let newMistakes = mistakes;
    if (val !== 0 && val !== solution[r][c]) {
      newMistakes = mistakes + 1;
      setMistakes(newMistakes);
    }
    const done = newBoard.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]));
    if (done) finish(newMistakes);
  };

  if (phase === 'menu') {
    return (
      <div className="border-2 border-ink shadow-hard bg-cream p-4 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
          Pilih tingkat kesulitan
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(GIVENS) as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => start(diff, false)}
              className="py-3 text-sm font-extrabold border-2 border-ink bg-cream hover:bg-lime transition-colors duration-100"
            >
              {DIFF_LABEL[diff]}
            </button>
          ))}
        </div>
        <button
          onClick={() => start('MEDIUM', true)}
          className="w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          🗓 Tantangan Harian (sama untuk semua pemain)
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <GameResultCard
        result={result}
        submitting={submitting}
        error={error}
        onRetry={() => setPhase('menu')}
        retryLabel="↺ Pilih Level"
      >
        <p className="font-extrabold text-lg">
          {isDaily ? '🗓 Tantangan Harian' : DIFF_LABEL[difficulty]} selesai — {mistakes} kesalahan,{' '}
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </p>
      </GameResultCard>
    );
  }

  return (
    <div className="border-2 border-ink shadow-hard bg-cream">
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-widest">
          {isDaily ? '🗓 Harian' : DIFF_LABEL[difficulty]} · ⏱{' '}
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </span>
        <span className="text-sm font-extrabold bg-ink text-cream px-2 py-0.5">
          ✗ {mistakes}
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-9 border-2 border-ink">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const given = puzzle[r][c] !== 0;
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isWrong = cell !== 0 && cell !== solution[r][c];
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => setSelected([r, c])}
                  className={cn(
                    'aspect-square flex items-center justify-center text-sm sm:text-base font-bold border-ink/30 border-[0.5px] transition-colors duration-75',
                    c % 3 === 2 && c !== 8 && 'border-r-2 border-r-ink',
                    r % 3 === 2 && r !== 8 && 'border-b-2 border-b-ink',
                    given ? 'bg-cream-2 font-extrabold' : 'bg-cream',
                    isSelected && 'bg-lime',
                    isWrong && 'text-coral',
                  )}
                >
                  {cell !== 0 ? cell : ''}
                </button>
              );
            }),
          )}
        </div>

        <div className="grid grid-cols-10 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => place(n)}
              className="aspect-square text-sm sm:text-base font-extrabold border-2 border-ink bg-cream hover:bg-lime active:bg-lime transition-colors duration-75"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => place(0)}
            className="aspect-square text-sm font-extrabold border-2 border-ink bg-coral text-cream"
            aria-label="Hapus isi sel"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={() => setPhase('menu')}
          className="text-xs font-extrabold underline decoration-lime decoration-2 text-muted hover:text-ink"
        >
          ← Menyerah, kembali ke menu
        </button>
      </div>
    </div>
  );
}
