import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { cn } from '../../lib/cn';

interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
}

interface QuizToday {
  dateKey: string;
  alreadyPlayed: boolean;
  lastScore: number | null;
  questions: QuizQuestion[];
}

interface QuizGraded {
  correctCount: number;
  total: number;
  results: { id: string; correctIndex: number; isCorrect: boolean }[];
  saved: { score: number; pointsEarned: number };
}

const TOPIC_LABEL: Record<string, string> = {
  UMUM: '🌏 Umum',
  SAINS: '🔬 Sains',
  TEKNOLOGI: '💻 Teknologi',
  SEJARAH: '📜 Sejarah',
  GEOGRAFI: '🗺 Geografi',
  BAHASA: '📖 Bahasa',
  MATEMATIKA: '➗ Matematika',
};

export default function QuizGame() {
  const [quiz, setQuiz] = useState<QuizToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [graded, setGraded] = useState<QuizGraded | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ success: true; data: QuizToday }>('/games/quiz/today')
      .then((res) => setQuiz(res.data.data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const choose = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const submit = async () => {
    if (!quiz) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      const payload = quiz.questions.map((q) => answers[q.id] ?? -1);
      const res = await api.post<{ success: true; data: QuizGraded }>('/games/quiz/submit', {
        answers: payload,
      });
      setGraded(res.data.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Gagal mengirim jawaban. Coba lagi.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-48 border-2 border-ink/20 bg-cream-2 animate-pulse" />;

  if (loadError || !quiz) {
    return (
      <div className="border-2 border-coral p-6 shadow-hard-coral text-center">
        <p className="text-muted font-semibold">Gagal memuat kuis. Muat ulang halaman ya.</p>
      </div>
    );
  }

  // Sudah main hari ini (sebelum sesi ini) — tampilkan skor terakhir
  if (quiz.alreadyPlayed && !graded) {
    return (
      <div className="border-2 border-ink p-8 shadow-hard bg-cream text-center space-y-2">
        <p className="text-4xl">✅</p>
        <p className="font-extrabold text-lg">Kuis hari ini sudah dikerjakan</p>
        {quiz.lastScore !== null && (
          <p className="text-sm font-extrabold">
            Skor kamu: <span className="bg-lime px-2 py-0.5">{quiz.lastScore}</span>
          </p>
        )}
        <p className="text-sm text-muted font-semibold">Soal baru muncul besok pukul 00:00 WIB.</p>
      </div>
    );
  }

  // Hasil setelah submit
  if (graded) {
    return (
      <div className="space-y-4">
        <div className="border-2 border-ink p-6 shadow-hard bg-cream text-center space-y-2">
          <p className="text-5xl font-extrabold">
            {graded.correctCount}/{graded.total}
          </p>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Jawaban benar</p>
          <p className="text-sm font-extrabold">
            Skor {graded.saved.score} ·{' '}
            {graded.saved.pointsEarned > 0 ? (
              <span className="bg-lime px-2 py-0.5">+{graded.saved.pointsEarned} poin</span>
            ) : (
              <span className="text-muted">cap harian tercapai</span>
            )}
          </p>
        </div>

        <div className="border-2 border-ink shadow-hard divide-y-2 divide-ink">
          {quiz.questions.map((q, i) => {
            const r = graded.results[i];
            return (
              <div key={q.id} className={cn('px-4 py-3', r.isCorrect ? 'bg-lime/40' : 'bg-coral/10')}>
                <p className="text-xs font-extrabold text-muted mb-1">{TOPIC_LABEL[q.topic] ?? q.topic}</p>
                <p className="font-bold text-sm mb-1">
                  {r.isCorrect ? '✅' : '❌'} {q.question}
                </p>
                <p className="text-xs font-semibold text-muted">
                  Jawaban benar: <span className="font-extrabold text-ink">{q.options[r.correctIndex]}</span>
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted font-semibold text-center">Soal baru besok pukul 00:00 WIB!</p>
      </div>
    );
  }

  const q = quiz.questions[current];
  const chosen = answers[q.id];
  const answeredCount = quiz.questions.filter((qq) => answers[qq.id] !== undefined).length;
  const allAnswered = answeredCount === quiz.questions.length;
  const isLast = current === quiz.questions.length - 1;

  return (
    <div className="border-2 border-ink shadow-hard bg-cream">
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-widest">
          {TOPIC_LABEL[q.topic] ?? q.topic}
        </span>
        <span className="text-sm font-extrabold bg-ink text-cream px-2 py-0.5">
          {current + 1}/{quiz.questions.length}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <p className="font-extrabold text-base leading-snug">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => choose(q.id, idx)}
              className={cn(
                'w-full text-left px-4 py-3 text-sm font-bold border-2 border-ink transition-colors duration-100',
                chosen === idx ? 'bg-ink text-cream' : 'bg-cream hover:bg-cream-2',
              )}
            >
              {String.fromCharCode(65 + idx)}. {opt}
            </button>
          ))}
        </div>

        {submitError && <p className="text-coral text-sm font-bold">{submitError}</p>}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-4 py-2 text-sm font-extrabold border-2 border-ink disabled:opacity-30 hover:bg-cream-2 transition-colors"
          >
            ← Sebelumnya
          </button>

          {isLast ? (
            <button
              onClick={submit}
              disabled={!allAnswered || submitting}
              className="px-5 py-2 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-40 disabled:shadow-hard-sm disabled:translate-x-0 disabled:translate-y-0"
            >
              {submitting ? 'Menilai...' : `Kumpulkan (${answeredCount}/${quiz.questions.length})`}
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => Math.min(quiz.questions.length - 1, c + 1))}
              disabled={chosen === undefined}
              className="px-4 py-2 text-sm font-extrabold border-2 border-ink bg-ink text-cream disabled:opacity-40 transition-all duration-100"
            >
              Berikutnya →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
