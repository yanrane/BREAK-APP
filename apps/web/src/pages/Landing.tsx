import { Link } from 'react-router-dom';

const missions = [
  { emoji: '🏃', label: 'Jogging 15 menit', pts: 20, cat: 'Fisik' },
  { emoji: '📖', label: 'Baca buku 20 halaman', pts: 15, cat: 'Mental' },
  { emoji: '📞', label: 'Telepon keluarga', pts: 10, cat: 'Sosial' },
  { emoji: '🌿', label: 'Foto alam luar rumah', pts: 10, cat: 'Fisik' },
  { emoji: '✍️', label: 'Jurnal tangan 1 halaman', pts: 15, cat: 'Kreatif' },
  { emoji: '🧘', label: 'Meditasi 10 menit', pts: 15, cat: 'Mental' },
];

const stats = [
  { value: '30+', label: 'Menit rata-rata scrolling per hari' },
  { value: '60%', label: 'Pengguna merasa waktu terbuang' },
  { value: '2×', label: 'Penurunan fokus setelah doomscrolling' },
];

export default function Landing() {
  return (
    <div className="space-y-20 py-8">
      {/* Hero */}
      <section className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-medium px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
          🧠 Brain Rot Elimination Awareness Kit
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
          Putuskan loop{' '}
          <span className="text-brand-600 dark:text-brand-500">doomscrolling</span>.<br />
          Bangun kebiasaan nyata.
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          BREAK membantu kamu menyadari waktu yang hilang di media sosial dan
          menggantinya dengan misi harian di dunia nyata.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors"
          >
            Mulai Gratis
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            Masuk
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        {stats.map((s) => (
          <div
            key={s.label}
            className="text-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6"
          >
            <p className="text-4xl font-extrabold text-brand-600 dark:text-brand-500">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* What is brain rot */}
      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-center">Apa itu <em>brain rot</em>?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: '⚡',
              title: 'Dopamin berlebih',
              desc: 'Konten pendek memicu dopamin hit yang sering — menurunkan motivasi untuk aktivitas low-stimulation seperti baca buku atau olahraga.',
            },
            {
              icon: '🎯',
              title: 'Rentang fokus menyusut',
              desc: 'Heavy scrolling secara konsisten dikaitkan dengan penurunan kemampuan fokus bertahan dalam jangka panjang.',
            },
            {
              icon: '😴',
              title: 'Tidur terganggu',
              desc: 'Blue light + stimulasi emosional sebelum tidur mengganggu fase REM — kamu lelah tapi tak benar-benar istirahat.',
            },
            {
              icon: '😰',
              title: 'Loop kecemasan FOMO',
              desc: 'Algoritma dirancang untuk memaksimalkan engagement — efek sampingnya adalah kecemasan sosial yang terus diperbarui.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-2"
            >
              <p className="text-2xl">{item.icon}</p>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-center">Cara kerja BREAK</h2>
        <div className="space-y-4">
          {[
            {
              step: '01',
              title: 'Dapatkan 3 misi hari ini',
              desc: 'Setiap pagi BREAK memberikan 3 misi personal — aktivitas fisik, mental, dan sosial.',
            },
            {
              step: '02',
              title: 'Kerjakan & upload bukti',
              desc: 'Selesaikan misi di dunia nyata, foto buktinya, upload. Poin langsung masuk.',
            },
            {
              step: '03',
              title: 'Kumpulkan poin & naik ranking',
              desc: 'Kompetisi di leaderboard mingguan dengan teman. Streak 7 hari? Bonus +50 poin.',
            },
            {
              step: '04',
              title: 'Latih fokus dengan mini games',
              desc: 'Reaksi time, fast clicking — mini games untuk melatih kemampuan fokus yang menghasilkan poin.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
            >
              <span className="text-3xl font-extrabold text-brand-200 dark:text-brand-900 leading-none pt-1 select-none">
                {item.step}
              </span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission pool preview */}
      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-center">Contoh misi</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {missions.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2"
            >
              <p className="text-2xl">{m.emoji}</p>
              <p className="font-medium text-sm leading-tight">{m.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full">
                  +{m.pts} pts
                </span>
                <span className="text-xs text-gray-400">{m.cat}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 py-8 max-w-xl mx-auto">
        <h2 className="text-3xl font-bold">Siap memulai?</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Gratis. Tanpa langganan. Mulai hari ini.
        </p>
        <Link
          to="/register"
          className="inline-block px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors"
        >
          Buat Akun Sekarang
        </Link>
      </section>
    </div>
  );
}
