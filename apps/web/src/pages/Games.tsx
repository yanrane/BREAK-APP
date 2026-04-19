import ReactionGame from '../features/games/ReactionGame';

const COMING_SOON = [
  { icon: '🖱️', title: 'Fast Clicking', description: 'Klik sebanyak mungkin dalam 10 detik' },
  { icon: '🧩', title: 'Pattern Match', description: 'Hafal dan reproduksi urutan warna' },
];

export default function Games() {
  return (
    <div className="max-w-xl space-y-8">
      <div className="border-b-2 border-ink pb-5">
        <p className="text-label mb-1">Latih Otak</p>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">Mini Games</h1>
        <p className="text-sm text-muted font-semibold mt-2">
          Dapatkan poin dengan latihan fokus. Maks 20 pts/hari.
        </p>
      </div>

      <section>
        <p className="text-label mb-4">Tersedia Sekarang</p>
        <ReactionGame />
      </section>

      <section>
        <p className="text-label mb-3">Segera Hadir</p>
        <div className="space-y-2">
          {COMING_SOON.map(({ icon, title, description }) => (
            <div
              key={title}
              className="flex items-center gap-4 border-2 border-ink/30 p-4 bg-cream-2 opacity-60"
            >
              <span className="text-3xl">{icon}</span>
              <div className="flex-1">
                <p className="font-extrabold text-sm">{title}</p>
                <p className="text-xs text-muted font-medium mt-0.5">{description}</p>
              </div>
              <span className="text-xs font-extrabold border-2 border-ink/30 px-2 py-0.5 shrink-0">
                Phase 2
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
