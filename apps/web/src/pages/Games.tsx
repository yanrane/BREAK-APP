import ReactionGame from '../features/games/ReactionGame';
import { cn } from '../lib/cn';

const COMING_SOON = [
  { icon: '🖱️', title: 'Fast Clicking', description: 'Klik sebanyak mungkin dalam 10 detik' },
  { icon: '🧩', title: 'Pattern Match', description: 'Hafal dan reproduksi urutan warna' },
];

export default function Games() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mini Games</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Latih fokus dan dapatkan poin. Maks 20 poin/hari dari game.
        </p>
      </div>

      <section>
        <ReactionGame />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Segera Hadir
        </h2>
        <div className="space-y-3">
          {COMING_SOON.map(({ icon, title, description }) => (
            <div
              key={title}
              className={cn(
                'flex items-center gap-4 rounded-xl border p-4',
                'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-50',
              )}
            >
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
                Phase 2
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
