import { Link } from 'react-router-dom';

const HOW = [
  { n: '01', title: 'Sadari kebiasaanmu', body: 'BREAK memantau waktu scrolling-mu dan mengingatkan saat sudah kebablasan.' },
  { n: '02', title: 'Kerjakan misi nyata', body: 'Setiap hari kamu dapat 3 misi dunia nyata — jogging, baca buku, jurnal tangan.' },
  { n: '03', title: 'Jaga streak-mu', body: 'Konsistensi harian membangun streak. Pet virtualmu ikut tumbuh setiap kamu konsisten.' },
  { n: '04', title: 'Latih fokusmu', body: 'Mini games melatih reaksi dan konsentrasi — pengganti dopamin murahan dari scrolling.' },
];

export default function About() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <section className="py-8 md:py-12">
        <div className="inline-flex items-center gap-2 border-2 border-ink px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
          Tentang Kami
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[0.95] tracking-tight mb-5">
          Rebut kembali <span className="bg-lime px-2">fokusmu.</span>
        </h1>
        <p className="text-lg text-muted max-w-xl font-medium leading-relaxed">
          BREAK (Brain Rot Elimination Awareness Kit) membantu kamu mengurangi kebiasaan
          scrolling berlebihan, membangun fokus, menjalankan misi positif di dunia nyata,
          dan menjaga konsistensi lewat sistem streak.
        </p>
      </section>

      {/* Our Mission */}
      <section className="py-10 border-t-2 border-ink">
        <p className="text-label mb-3">Misi Kami</p>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
          Memutus loop doomscrolling.
        </h2>
        <p className="text-muted font-medium leading-relaxed max-w-xl">
          Media sosial dirancang untuk menahanmu selama mungkin. Misi kami sederhana:
          mengembalikan waktu dan atensimu ke hal yang benar-benar kamu pedulikan —
          kesehatan, hubungan, dan karya nyata. Bukan dengan melarang, tapi dengan
          menggantinya dengan sesuatu yang lebih baik.
        </p>
      </section>

      {/* Why BREAK APP Exists */}
      <section className="py-10 border-t-2 border-ink">
        <p className="text-label mb-3">Kenapa BREAK Ada</p>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
          Karena scrolling 5 menit tidak pernah 5 menit.
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border-2 border-ink p-5 bg-cream-2 shadow-hard">
            <p className="text-2xl mb-3">🧠</p>
            <p className="font-extrabold text-base mb-1">Brain rot itu nyata</p>
            <p className="text-sm text-muted leading-relaxed font-medium">
              Konten pendek tanpa henti menurunkan rentang fokus dan motivasi untuk
              aktivitas yang butuh usaha — baca buku, olahraga, ngobrol beneran.
            </p>
          </div>
          <div className="border-2 border-ink p-5 bg-cream-2 shadow-hard">
            <p className="text-2xl mb-3">🌱</p>
            <p className="font-extrabold text-base mb-1">Kebiasaan bisa dibalik</p>
            <p className="text-sm text-muted leading-relaxed font-medium">
              Dengan misi kecil setiap hari, streak yang terjaga, dan sedikit kompetisi
              sehat, otak bisa dilatih ulang untuk menikmati dunia nyata lagi.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 border-t-2 border-ink">
        <p className="text-label mb-3">Cara Kerja</p>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
          Empat langkah, setiap hari.
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
                <p className="text-sm text-muted font-medium mt-1 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 border-t-2 border-ink">
        <div className="border-2 border-ink p-8 bg-ink text-cream shadow-hard-lime">
          <h2 className="text-3xl font-extrabold mb-2 leading-tight">Siap berhenti scrolling?</h2>
          <p className="text-cream/60 font-medium mb-6">Gratis, tanpa iklan, selamanya.</p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 text-sm font-extrabold border-2 border-lime bg-lime text-ink shadow-[4px_4px_0_0_#C2F13B] hover:shadow-[2px_2px_0_0_#C2F13B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            Mulai Sekarang →
          </Link>
        </div>
      </section>
    </div>
  );
}
