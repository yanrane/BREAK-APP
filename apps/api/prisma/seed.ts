import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const missions = [
  {
    slug: 'jogging-15min',
    title: 'Jogging minimal 15 menit',
    description: 'Lari atau jalan cepat di luar ruangan minimal 15 menit. Upload foto sepatu/route/GPS tracker sebagai bukti.',
    category: 'PHYSICAL' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'read-20pages',
    title: 'Baca buku fisik 20 halaman',
    description: 'Baca buku fisik (bukan e-book) minimal 20 halaman. Upload foto halaman terakhir yang kamu baca.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'call-family',
    title: 'Telepon anggota keluarga 10 menit',
    description: 'Telepon orang tua, saudara, atau keluarga dekat minimal 10 menit. Upload screenshot durasi panggilan.',
    category: 'SOCIAL' as const,
    points: 10,
    requiresProof: true,
    cooldownHours: 48,
  },
  {
    slug: 'outdoor-photo',
    title: 'Foto pemandangan di luar rumah',
    description: 'Keluar rumah dan ambil foto pemandangan alam, taman, atau lingkungan sekitar.',
    category: 'PHYSICAL' as const,
    points: 10,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'handwrite-journal',
    title: 'Tulis jurnal tangan 1 halaman',
    description: 'Tulis jurnal harian dengan tangan di atas kertas, minimal 1 halaman penuh. Upload foto tulisanmu.',
    category: 'CREATIVE' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'meditation-10min',
    title: 'Meditasi 10 menit',
    description: 'Lakukan sesi meditasi minimal 10 menit menggunakan timer atau app meditasi. Upload screenshot timer.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'cook-meal',
    title: 'Masak 1 menu sendiri',
    description: 'Masak makanan atau minuman dari bahan baku (bukan instan). Upload foto hasil masakanmu.',
    category: 'CREATIVE' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 48,
  },
  {
    slug: 'meet-friend',
    title: 'Ngobrol langsung dengan teman',
    description: 'Bertemu dan ngobrol tatap muka dengan minimal 1 teman selama 30 menit. Upload foto kalian.',
    category: 'SOCIAL' as const,
    points: 20,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'stretch-10min',
    title: 'Peregangan 10 menit',
    description: 'Lakukan peregangan atau yoga ringan minimal 10 menit. Upload foto atau screenshot timer.',
    category: 'PHYSICAL' as const,
    points: 10,
    requiresProof: true,
    cooldownHours: 24,
  },
  {
    slug: 'learn-something',
    title: 'Pelajari hal baru 20 menit',
    description: 'Pelajari keterampilan baru dari buku, kursus, atau tutorial (bukan konten hiburan) minimal 20 menit.',
    category: 'MENTAL' as const,
    points: 15,
    requiresProof: true,
    cooldownHours: 24,
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
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
