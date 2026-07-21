import 'dotenv/config';
import prisma from '../src/lib/prisma';

const missions = [
  {
    slug: 'walk-run-1km',
    title: 'Jalan atau lari 1 km',
    description:
      'Keluar rumah dan tempuh 1 km — jalan santai, jalan cepat, atau lari. Jarak dilacak GPS langsung dari HP kamu; biarkan halaman tetap terbuka selama bergerak.',
    category: 'PHYSICAL' as const,
    points: 25,
    requiresProof: true,
    cooldownHours: 24,
    proofType: 'GPS' as const,
    distanceMeters: 1000,
  },
  {
    slug: 'jogging-15min',
    title: 'Jogging minimal 15 menit',
    description: 'Lari atau jalan cepat di luar ruangan minimal 15 menit. Setelah timer selesai, jepret foto suasana larimu langsung dari kamera.',
    category: 'PHYSICAL' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 24,
    proofType: 'PHOTO_AND_TIMER' as const,
    durationMinutes: 15,
  },
  {
    slug: 'read-20pages',
    title: 'Baca buku fisik 20 halaman',
    description: 'Baca buku fisik (bukan e-book) minimal 20 menit. Setelah timer selesai, jepret foto halaman yang kamu baca.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
    proofType: 'PHOTO_AND_TIMER' as const,
    durationMinutes: 20,
  },
  {
    slug: 'call-family',
    title: 'Telepon anggota keluarga 10 menit',
    description: 'Telepon orang tua, saudara, atau keluarga dekat minimal 10 menit selagi timer berjalan.',
    category: 'SOCIAL' as const,
    points: 10,
    requiresProof: false,
    cooldownHours: 48,
    proofType: 'TIMER' as const,
    durationMinutes: 10,
  },
  {
    slug: 'outdoor-photo',
    title: 'Foto pemandangan di luar rumah',
    description: 'Keluar rumah dan jepret foto pemandangan alam, taman, atau lingkungan sekitar langsung dari kamera.',
    category: 'PHYSICAL' as const,
    points: 10,
    requiresProof: true,
    cooldownHours: 24,
    proofType: 'PHOTO' as const,
    durationMinutes: null,
  },
  {
    slug: 'handwrite-journal',
    title: 'Tulis jurnal tangan 1 halaman',
    description: 'Tulis jurnal harian dengan tangan di atas kertas, minimal 1 halaman penuh. Jepret foto tulisanmu.',
    category: 'CREATIVE' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
    proofType: 'PHOTO' as const,
    durationMinutes: null,
  },
  {
    slug: 'meditation-10min',
    title: 'Meditasi 10 menit',
    description: 'Lakukan sesi meditasi minimal 10 menit selagi timer berjalan.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: false,
    cooldownHours: 24,
    proofType: 'TIMER' as const,
    durationMinutes: 10,
  },
  {
    slug: 'cook-meal',
    title: 'Masak 1 menu sendiri',
    description: 'Masak makanan atau minuman dari bahan baku (bukan instan). Jepret foto hasil masakanmu.',
    category: 'CREATIVE' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 48,
    proofType: 'PHOTO' as const,
    durationMinutes: null,
  },
  {
    slug: 'meet-friend',
    title: 'Ngobrol langsung dengan teman',
    description: 'Bertemu dan ngobrol tatap muka dengan minimal 1 teman. Jepret foto kalian berdua.',
    category: 'SOCIAL' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 24,
    proofType: 'PHOTO' as const,
    durationMinutes: null,
  },
  {
    slug: 'stretch-10min',
    title: 'Peregangan 10 menit',
    description: 'Lakukan peregangan atau yoga ringan minimal 10 menit selagi timer berjalan.',
    category: 'PHYSICAL' as const,
    points: 10,
    requiresProof: false,
    cooldownHours: 24,
    proofType: 'TIMER' as const,
    durationMinutes: 10,
  },
  {
    slug: 'learn-something',
    title: 'Pelajari hal baru 20 menit',
    description: 'Pelajari keterampilan baru dari buku, kursus, atau tutorial (bukan konten hiburan) minimal 20 menit selagi timer berjalan.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: false,
    cooldownHours: 24,
    proofType: 'TIMER' as const,
    durationMinutes: 20,
  },
  {
    slug: 'no-phone-15min',
    title: 'Tanpa HP 15 menit',
    description: 'Letakkan HP dan jangan sentuh selama 15 menit. Timer jalan fullscreen — keluar dari layar akan menjeda misi.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: false,
    cooldownHours: 24,
    proofType: 'TIMER' as const,
    durationMinutes: 15,
  },
];

async function main() {
  console.log('Seeding missions...');
  for (const mission of missions) {
    await prisma.mission.upsert({
      where: { slug: mission.slug },
      update: mission,
      create: mission,
    });
  }
  console.log(`Seeded ${missions.length} missions.`);

  // Contoh event: 2x EXP Weekend, 7 hari ke depan (hanya jika belum ada event)
  const existingEvent = await prisma.event.findFirst();
  if (!existingEvent) {
    const now = new Date();
    await prisma.event.create({
      data: {
        title: '2x EXP Event',
        expMultiplier: 2,
        startsAt: now,
        endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('Seeded 2x EXP event (7 hari).');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
