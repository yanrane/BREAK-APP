import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { submitGameScore, type GameScoreResult } from './gameApi';
import GameResultCard from './GameResultCard';

const DURATION_S = 60;
// 22+ benar dalam 60 detik = skor sempurna 1000
const SCORE_PER_CORRECT = 45;

type Phase = 'idle' | 'running' | 'finished';

interface Question {
  text: string;
  answer: number;
  options: number[];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Soal makin sulit seiring jumlah benar: tambah → kurang → kali → campuran besar. */
function makeQuestion(correctCount: number): Question {
  let a: number, b: number, answer: number, text: string;
  if (correctCount < 5) {
    a = randInt(2, 20); b = randInt(2, 20);
    answer = a + b; text = `${a} + ${b}`;
  } else if (correctCount < 10) {
    a = randInt(10, 60); b = randInt(2, a);
    answer = a - b; text = `${a} − ${b}`;
  } else if (correctCount < 16) {
    a = randInt(3, 12); b = randInt(3, 12);
    answer = a * b; text = `${a} × ${b}`;
  } else {
    a = randInt(6, 15); b = randInt(6, 15);
    const c = randInt(5, 40);
    answer = a * b + c; text = `${a} × ${b} + ${c}`;
  }

  // 4 opsi: jawaban benar + 3 pengecoh unik di sekitarnya
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const delta = randInt(1, Math.max(3, Math.round(answer * 0.2)));
    options.add(Math.max(0, answer + (Math.random() < 0.5 ? -delta : delta)));
  }
  return { text, answer, options: [...options].sort(() => Math.random() - 0.5) };
}

export default function MathSprintGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [question, setQuestion] = useState<Question | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION_S);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
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
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'finished') return;
    setSubmitting(true);
    setError(null);
    submitGameScore('MATH_SPRINT', Math.min(1000, correct * SCORE_PER_CORRECT))
      .then(setResult)
      .catch(() => setError('Gagal menyimpan skor. Coba lagi.'))
      .finally(() => setSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = () => {
    setCorrect(0);
    setWrong(0);
    setResult(null);
    setError(null);
    setFeedback(null);
    setTimeLeft(DURATION_S);
    setQuestion(makeQuestion(0));
    endAtRef.current = Date.now() + DURATION_S * 1000;
    setPhase('running');
  };

  const answer = (value: number) => {
    if (!question || phase !== 'running') return;
    const isRight = value === question.answer;
    const newCorrect = correct + (isRight ? 1 : 0);
    if (isRight) setCorrect(newCorrect);
    else setWrong((w) => w + 1);
    setFeedback(isRight ? 'right' : 'wrong');
    setTimeout(() => setFeedback(null), 250);
    setQuestion(makeQuestion(newCorrect));
  };

  if (phase === 'finished') {
    return (
      <GameResultCard result={result} submitting={submitting} error={error} onRetry={start}>
        <p className="font-extrabold text-lg">
          ✅ {correct} benar · ❌ {wrong} salah dalam {DURATION_S} detik
        </p>
      </GameResultCard>
    );
  }

  return (
    <div className="border-2 border-ink shadow-hard bg-cream">
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-widest">
          {phase === 'idle' ? 'Hitung cepat 60 detik' : `⏱ ${Math.ceil(timeLeft)}s`}
        </span>
        <span className="text-sm font-extrabold bg-ink text-cream px-2 py-0.5">✅ {correct}</span>
      </div>

      {phase === 'running' && (
        <div className="h-2 border-b-2 border-ink bg-cream-2">
          <div
            className="h-full bg-lime transition-[width] duration-200"
            style={{ width: `${(timeLeft / DURATION_S) * 100}%` }}
          />
        </div>
      )}

      <div className="p-4 space-y-4">
        {phase === 'idle' ? (
          <button
            onClick={start}
            className="w-full py-16 text-lg font-extrabold border-2 border-ink bg-lime shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            ▶ Mulai Sprint
          </button>
        ) : (
          question && (
            <>
              <p
                className={cn(
                  'text-center text-4xl font-extrabold py-6 border-2 border-ink transition-colors duration-150',
                  feedback === 'right' && 'bg-lime',
                  feedback === 'wrong' && 'bg-coral text-cream',
                  !feedback && 'bg-cream-2',
                )}
              >
                {question.text} = ?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => answer(opt)}
                    className="py-4 text-xl font-extrabold border-2 border-ink bg-cream hover:bg-lime active:bg-lime transition-colors duration-100"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
