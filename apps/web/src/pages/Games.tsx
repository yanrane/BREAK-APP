import { useState } from "react";
import ReactionGame from "../features/games/ReactionGame";
import FastClickGame from "../features/games/FastClickGame";
import PatternMatchGame from "../features/games/PatternMatchGame";
import SudokuGame from "../features/games/SudokuGame";
import MemoryGame from "../features/games/MemoryGame";
import MathSprintGame from "../features/games/MathSprintGame";
import QuizGame from "../features/games/QuizGame";

type GameId =
  "reaction" | "fast_click" | "pattern" | "sudoku" | "memory" | "math" | "quiz";

const GAMES: {
  id: GameId;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: "quiz",
    icon: "🧠",
    title: "Kuis Harian",
    description: "5 soal pengetahuan baru setiap hari — sekali main per hari",
    badge: "Harian",
  },
  {
    id: "sudoku",
    icon: "🔢",
    title: "Sudoku",
    description: "Logika angka klasik: Mudah, Sedang, Sulit + tantangan harian",
  },
  {
    id: "math",
    icon: "➗",
    title: "Math Sprint",
    description: "Hitung cepat 60 detik, soal makin sulit — pengasah otak",
  },
  {
    id: "memory",
    icon: "🃏",
    title: "Memory",
    description: "Temukan pasangan kartu dengan percobaan sesedikit mungkin",
  },
  {
    id: "pattern",
    icon: "🧩",
    title: "Pattern Match",
    description: "Hafal urutan kotak yang menyala, level terus naik",
  },
  {
    id: "reaction",
    icon: "⚡",
    title: "Reaction Time",
    description: "Seberapa cepat refleksmu? 5 ronde, ambil rata-rata",
  },
  {
    id: "fast_click",
    icon: "🖱️",
    title: "Fast Clicking",
    description: "Klik sebanyak mungkin dalam 10 detik (CPS test)",
  },
];

const GAME_COMPONENT: Record<GameId, React.ComponentType> = {
  reaction: ReactionGame,
  fast_click: FastClickGame,
  pattern: PatternMatchGame,
  sudoku: SudokuGame,
  memory: MemoryGame,
  math: MathSprintGame,
  quiz: QuizGame,
};

export default function Games() {
  const [selected, setSelected] = useState<GameId | null>(null);
  const game = GAMES.find((g) => g.id === selected);
  const Selected = selected ? GAME_COMPONENT[selected] : null;

  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b-2 border-ink pb-5">
        <p className="text-label mb-1">Brain Training</p>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">
          Mini Games
        </h1>
        <p className="text-sm text-muted font-semibold mt-2">
          Latih fokus, logika, dan daya ingat. Poin masuk otomatis — maks 20
          pts/hari dari game.
        </p>
      </div>

      {Selected && game ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setSelected(null)}
              className="text-sm font-extrabold underline decoration-lime decoration-2 hover:text-muted transition-colors"
            >
              ← Semua Game
            </button>
            <p className="font-extrabold text-sm">
              {game.icon} {game.title}
            </p>
          </div>
          <Selected />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {GAMES.map(({ id, icon, title, description, badge }, i) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`text-left border-2 border-ink p-4 bg-cream ${["shadow-hard-magenta", "shadow-hard-aqua", "shadow-hard-grape", "shadow-hard-coral", "shadow-hard-lime"][i % 5]} hover:bg-lime hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{icon}</span>
                {badge && (
                  <span className="text-xs font-extrabold bg-ink text-cream px-2 py-0.5">
                    {badge}
                  </span>
                )}
              </div>
              <p className="font-extrabold text-sm mb-1">{title}</p>
              <p className="text-xs text-muted font-medium leading-relaxed">
                {description}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
