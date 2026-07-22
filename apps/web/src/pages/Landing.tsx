import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

const STATS = [
  { value: "30+", label: "menit terbuang scrolling per hari" },
  { value: "60%", label: "pengguna merasa waktunya hilang" },
  { value: "2×", label: "penurunan fokus setelah doomscrolling" },
];

const HOW = [
  {
    n: "01",
    title: "Dapat 3 misi hari ini",
    body: "Setiap pagi kamu dapat 3 misi nyata — fisik, mental, sosial.",
  },
  {
    n: "02",
    title: "Kerjakan & foto buktinya",
    body: "Lakukan di dunia nyata, upload foto, poin langsung masuk.",
  },
  {
    n: "03",
    title: "Naik di leaderboard",
    body: "Kompetisi mingguan dengan teman. Streak 7 hari = +50 bonus.",
  },
  {
    n: "04",
    title: "Latih otak dengan mini games",
    body: "Reaction time & fast click melatih fokus — dapat poin juga.",
  },
];

const MISSIONS = [
  { e: "🏃", t: "Jogging 15 menit", p: 20, c: "Fisik" },
  { e: "📖", t: "Baca buku 20 halaman", p: 15, c: "Mental" },
  { e: "📞", t: "Telepon keluarga", p: 10, c: "Sosial" },
  { e: "🌿", t: "Foto alam luar rumah", p: 10, c: "Fisik" },
  { e: "✍️", t: "Jurnal tangan 1 hal.", p: 15, c: "Kreatif" },
  { e: "🧘", t: "Meditasi 10 menit", p: 15, c: "Mental" },
];

const EFFECTS = [
  {
    icon: "⚡",
    title: "Dopamin berlebih",
    body: "Konten pendek = dopamin hit yang cepat dan sering. Lama-lama motivasi untuk aktivitas dunia nyata turun drastis.",
  },
  {
    icon: "🎯",
    title: "Fokus menyusut",
    body: "Scrolling terus-menerus melatih otak untuk tidak bisa fokus lebih dari 8 detik.",
  },
  {
    icon: "😴",
    title: "Tidur rusak",
    body: "Stimulasi layar sebelum tidur mengganggu fase REM — kamu capek tapi tidak benar-benar istirahat.",
  },
  {
    icon: "😰",
    title: "FOMO tanpa henti",
    body: "Algoritma dirancang memaksimalkan engagement. Efek sampingnya: kecemasan sosial yang terus diperbarui.",
  },
];

export default function Landing() {
  return (
    <div className="space-y-0">
      {/* ── HERO ── */}
      <section className="py-16 md:py-24 max-w-3xl">
        <div className="inline-flex items-center gap-2 border-2 border-ink px-3 py-1 text-xs font-bold uppercase tracking-widest mb-8">
          Brain Rot Elimination Awareness Kit
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold leading-[0.9] tracking-tight mb-6">
          Berhenti<span className="text-magenta">.</span>
          <br />
          <span className="bg-lime px-2">scrolling</span>
          <span className="text-aqua">.</span>
        </h1>
        <p className="text-lg text-muted max-w-xl mb-10 font-medium leading-relaxed">
          BREAK membantu kamu menyadari waktu yang hilang di media sosial dan
          menggantinya dengan misi harian di dunia nyata.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/register"
            className="px-8 py-3 text-base font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
          >
            Mulai Gratis →
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 text-base font-bold border-2 border-ink text-ink shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
          >
            Masuk
          </Link>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="border-y-2 border-ink bg-lime py-10 max-w-3xl">
        <div className="grid grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.value}>
              <p className="text-5xl md:text-6xl font-extrabold text-ink leading-none">
                {s.value}
              </p>
              <p className="text-sm font-semibold text-ink/70 mt-2 leading-snug">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BRAIN ROT ── */}
      <section className="py-16 max-w-3xl">
        <p className="text-label mb-3">Masalah</p>
        <h2 className="text-4xl md:text-5xl font-extrabold mb-10 leading-tight">
          Apa itu{" "}
          <em className="not-italic underline decoration-magenta decoration-4">
            brain rot
          </em>
          ?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {EFFECTS.map((e, i) => (
            <div
              key={e.title}
              className={cn(
                "border-2 border-ink p-5 bg-cream-2",
                [
                  "shadow-hard-magenta",
                  "shadow-hard-aqua",
                  "shadow-hard-grape",
                  "shadow-hard-coral",
                ][i % 4],
              )}
            >
              <p className="text-2xl mb-3">{e.icon}</p>
              <p className="font-extrabold text-base mb-1">{e.title}</p>
              <p className="text-sm text-muted leading-relaxed font-medium">
                {e.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 border-t-2 border-ink max-w-3xl">
        <p className="text-label mb-3">Cara Kerja</p>
        <h2 className="text-4xl md:text-5xl font-extrabold mb-10 leading-tight">
          4 langkah memulai.
        </h2>
        <div className="space-y-3">
          {HOW.map((item) => (
            <div
              key={item.n}
              className="flex gap-6 border-2 border-ink p-5 bg-cream shadow-hard group hover:bg-lime transition-colors duration-150"
            >
              <span className="text-4xl font-extrabold text-ink/20 group-hover:text-ink/40 transition-colors leading-none pt-0.5 shrink-0 select-none">
                {item.n}
              </span>
              <div>
                <p className="font-extrabold text-base">{item.title}</p>
                <p className="text-sm text-muted font-medium mt-1 leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION PREVIEW ── */}
      <section className="py-16 border-t-2 border-ink max-w-3xl">
        <p className="text-label mb-3">Contoh Misi</p>
        <h2 className="text-4xl md:text-5xl font-extrabold mb-10 leading-tight">
          Aktivitas dunia nyata.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MISSIONS.map((m) => (
            <div
              key={m.t}
              className="border-2 border-ink p-4 bg-cream shadow-hard hover:bg-lime transition-colors duration-150 group"
            >
              <p className="text-3xl mb-3">{m.e}</p>
              <p className="font-bold text-sm leading-tight mb-3">{m.t}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold bg-ink text-cream px-2 py-0.5">
                  +{m.p} pts
                </span>
                <span className="text-xs font-semibold text-muted">{m.c}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 border-t-2 border-ink max-w-3xl">
        <div className="border-2 border-ink p-10 bg-ink text-cream shadow-hard-lime">
          <p className="text-label mb-4">Mulai Sekarang</p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight">
            Gratis. Selamanya.
          </h2>
          <p className="text-cream/60 font-medium mb-8 text-lg">
            Tanpa langganan. Tanpa iklan. Cuma kamu vs kebiasaanmu.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 text-base font-extrabold border-2 border-lime bg-lime text-ink shadow-[4px_4px_0_0_#C2F13B] hover:shadow-[2px_2px_0_0_#C2F13B] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
          >
            Buat Akun Sekarang →
          </Link>
        </div>
      </section>
    </div>
  );
}
