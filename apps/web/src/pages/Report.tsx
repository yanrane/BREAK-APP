import { Link } from 'react-router-dom';
import { useReport, petEmoji, STAGE_LABELS } from '../features/profile/useReport';

export default function Report() {
  const { data, loading, error } = useReport();

  if (loading) return <p className="text-muted font-semibold">Menyiapkan report...</p>;
  if (error || !data) return <p className="text-coral font-semibold">{error ?? 'Terjadi kesalahan'}</p>;

  const { user, pet, missionsCompleted, globalRank } = data;
  const daysSinceJoin = Math.max(
    1,
    Math.ceil((Date.now() - new Date(user.joinedAt).getTime()) / (24 * 60 * 60 * 1000)),
  );

  const cards = [
    {
      bg: 'bg-lime-100',
      big: `${daysSinceJoin} hari`,
      caption: `Kamu sudah bersama B.R.E.A.K sejak ${new Date(user.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    },
    {
      bg: 'bg-amber-100',
      big: `${missionsCompleted} misi`,
      caption: 'Total misi dunia nyata yang kamu selesaikan. Keren! 💪',
    },
    {
      bg: 'bg-orange-100',
      big: `${user.longestStreak} hari 🔥`,
      caption: `Streak tertinggimu. Saat ini: ${user.currentStreak} hari beruntun.`,
    },
    {
      bg: 'bg-blue-100',
      big: `${user.exp} EXP`,
      caption: `Total EXP terkumpul, dengan ${user.coins} coins di kantong.`,
    },
    ...(pet
      ? [
          {
            bg: 'bg-purple-100',
            big: `${petEmoji(pet.stage, user.gender)} ${STAGE_LABELS[pet.stage]}`,
            caption:
              pet.stage === 'EGG'
                ? `Telurmu punya ${pet.exp} EXP — selesaikan misi outdoor agar cepat menetas!`
                : `Pet ${pet.rarity} milikmu sudah mencapai stage ${STAGE_LABELS[pet.stage]} dengan ${pet.exp} EXP.`,
          },
        ]
      : []),
    {
      bg: 'bg-pink-100',
      big: `#${globalRank}`,
      caption: 'Posisimu di ranking global. Terus naik! 🚀',
    },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Your B.R.E.A.K Report</h1>
        <p className="text-sm text-muted font-semibold mt-1">
          Rangkuman perjalananmu melawan brain rot ✨
        </p>
      </div>

      {cards.map(({ bg, big, caption }, i) => (
        <div key={i} className={`border-2 border-ink p-8 shadow-hard text-center ${bg}`}>
          <p className="text-4xl font-extrabold tracking-tight mb-2">{big}</p>
          <p className="text-sm font-semibold text-ink/70">{caption}</p>
        </div>
      ))}

      <div className="text-center pt-2">
        <Link
          to="/missions"
          className="inline-block px-6 py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          Lanjutkan Misi Hari Ini →
        </Link>
      </div>
    </div>
  );
}
