/**
 * Bank soal Kuis Harian. Jawaban benar hanya ada di server —
 * client menerima soal tanpa correctIndex, penilaian di endpoint submit.
 */

export type QuizTopic =
  | 'UMUM'
  | 'SAINS'
  | 'TEKNOLOGI'
  | 'SEJARAH'
  | 'GEOGRAFI'
  | 'BAHASA'
  | 'MATEMATIKA';

export interface QuizQuestion {
  id: string;
  topic: QuizTopic;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export const QUESTIONS_PER_DAY = 5;

export const QUIZ_BANK: QuizQuestion[] = [
  // ── UMUM ──
  // Dulu "ibu kota saat ini" (kunci: Nusantara) — status hukumnya masih bergantung
  // Keppres pemindahan, jadi yang menjawab Jakarta ikut disalahkan. Diganti fakta lokasi.
  { id: 'umum-1', topic: 'UMUM', question: 'Ibu Kota Nusantara (IKN) dibangun di provinsi?', options: ['Kalimantan Barat', 'Kalimantan Timur', 'Kalimantan Selatan', 'Kalimantan Tengah'], correctIndex: 1 },
  { id: 'umum-2', topic: 'UMUM', question: 'Berapa jumlah pemain satu tim sepak bola di lapangan?', options: ['9', '10', '11', '12'], correctIndex: 2 },
  { id: 'umum-3', topic: 'UMUM', question: 'Organ tubuh manusia yang memompa darah adalah?', options: ['Paru-paru', 'Ginjal', 'Hati', 'Jantung'], correctIndex: 3 },
  { id: 'umum-4', topic: 'UMUM', question: 'Warna pada bendera Indonesia adalah?', options: ['Merah-Putih', 'Putih-Merah', 'Merah-Biru', 'Putih-Biru'], correctIndex: 0 },
  { id: 'umum-5', topic: 'UMUM', question: 'Hewan nasional Indonesia yang dijuluki "komodo dragon" berasal dari provinsi?', options: ['Papua', 'NTT', 'Maluku', 'Sulawesi Selatan'], correctIndex: 1 },
  { id: 'umum-6', topic: 'UMUM', question: 'Berapa jumlah provinsi di Indonesia per 2024?', options: ['34', '36', '38', '40'], correctIndex: 2 },
  { id: 'umum-7', topic: 'UMUM', question: 'Alat musik tradisional dari Jawa Barat yang digoyangkan adalah?', options: ['Gamelan', 'Angklung', 'Sasando', 'Kolintang'], correctIndex: 1 },
  { id: 'umum-8', topic: 'UMUM', question: 'Lagu kebangsaan Indonesia diciptakan oleh?', options: ['Ismail Marzuki', 'W.R. Supratman', 'C. Simanjuntak', 'Gesang'], correctIndex: 1 },
  { id: 'umum-9', topic: 'UMUM', question: 'Batik Indonesia diakui UNESCO sebagai warisan budaya pada tahun?', options: ['2005', '2007', '2009', '2011'], correctIndex: 2 },
  { id: 'umum-10', topic: 'UMUM', question: 'Olahraga bulu tangkis dimainkan menggunakan?', options: ['Bola kecil', 'Shuttlecock', 'Cakram', 'Bola karet'], correctIndex: 1 },

  // ── SAINS ──
  { id: 'sains-1', topic: 'SAINS', question: 'Planet terdekat dari Matahari adalah?', options: ['Venus', 'Mars', 'Merkurius', 'Bumi'], correctIndex: 2 },
  { id: 'sains-2', topic: 'SAINS', question: 'Proses tumbuhan membuat makanan dengan bantuan cahaya disebut?', options: ['Respirasi', 'Fotosintesis', 'Fermentasi', 'Evaporasi'], correctIndex: 1 },
  { id: 'sains-3', topic: 'SAINS', question: 'Simbol kimia untuk emas adalah?', options: ['Ag', 'Au', 'Fe', 'Cu'], correctIndex: 1 },
  { id: 'sains-4', topic: 'SAINS', question: 'Berapa kecepatan cahaya di ruang hampa (perkiraan)?', options: ['300 km/s', '3.000 km/s', '30.000 km/s', '300.000 km/s'], correctIndex: 3 },
  { id: 'sains-5', topic: 'SAINS', question: 'Bagian sel yang berfungsi sebagai pembangkit energi adalah?', options: ['Nukleus', 'Ribosom', 'Mitokondria', 'Membran'], correctIndex: 2 },
  { id: 'sains-6', topic: 'SAINS', question: 'Air membeku pada suhu berapa derajat Celsius?', options: ['-10', '0', '4', '10'], correctIndex: 1 },
  { id: 'sains-7', topic: 'SAINS', question: 'Gas yang paling banyak di atmosfer Bumi adalah?', options: ['Oksigen', 'Karbon dioksida', 'Nitrogen', 'Hidrogen'], correctIndex: 2 },
  { id: 'sains-8', topic: 'SAINS', question: 'Hewan yang mengalami metamorfosis sempurna adalah?', options: ['Kecoa', 'Belalang', 'Kupu-kupu', 'Jangkrik'], correctIndex: 2 },
  { id: 'sains-9', topic: 'SAINS', question: 'Satuan dasar arus listrik adalah?', options: ['Volt', 'Watt', 'Ohm', 'Ampere'], correctIndex: 3 },
  { id: 'sains-10', topic: 'SAINS', question: 'Tulang terkecil di tubuh manusia terletak di?', options: ['Jari', 'Telinga', 'Hidung', 'Pergelangan'], correctIndex: 1 },

  // ── TEKNOLOGI ──
  { id: 'tek-1', topic: 'TEKNOLOGI', question: 'Apa kepanjangan dari CPU?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctIndex: 0 },
  { id: 'tek-2', topic: 'TEKNOLOGI', question: 'Bahasa yang dipakai untuk menstruktur halaman web adalah?', options: ['Python', 'HTML', 'SQL', 'C++'], correctIndex: 1 },
  { id: 'tek-3', topic: 'TEKNOLOGI', question: 'Perusahaan yang membuat sistem operasi Android adalah?', options: ['Apple', 'Microsoft', 'Google', 'Samsung'], correctIndex: 2 },
  { id: 'tek-4', topic: 'TEKNOLOGI', question: 'Wi-Fi digunakan untuk?', options: ['Menyimpan data', 'Koneksi nirkabel', 'Mencetak dokumen', 'Mengedit foto'], correctIndex: 1 },
  { id: 'tek-5', topic: 'TEKNOLOGI', question: '1 gigabyte (GB) setara dengan berapa megabyte (MB)?', options: ['100', '512', '1024', '2048'], correctIndex: 2 },
  { id: 'tek-6', topic: 'TEKNOLOGI', question: 'Pendiri Microsoft adalah?', options: ['Steve Jobs', 'Bill Gates', 'Elon Musk', 'Mark Zuckerberg'], correctIndex: 1 },
  { id: 'tek-7', topic: 'TEKNOLOGI', question: 'Apa fungsi utama RAM pada komputer?', options: ['Penyimpanan permanen', 'Memori kerja sementara', 'Mengolah grafis', 'Koneksi internet'], correctIndex: 1 },
  { id: 'tek-8', topic: 'TEKNOLOGI', question: 'Protokol untuk mengamankan situs web ditandai dengan?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correctIndex: 2 },
  { id: 'tek-9', topic: 'TEKNOLOGI', question: 'QR pada "QR code" adalah singkatan dari?', options: ['Quick Response', 'Quality Rate', 'Query Result', 'Quick Read'], correctIndex: 0 },
  { id: 'tek-10', topic: 'TEKNOLOGI', question: 'Istilah untuk kecerdasan buatan adalah?', options: ['VR', 'AI', 'AR', 'IoT'], correctIndex: 1 },

  // ── SEJARAH ──
  { id: 'sej-1', topic: 'SEJARAH', question: 'Indonesia memproklamasikan kemerdekaan pada tanggal?', options: ['17 Agustus 1945', '17 Agustus 1949', '28 Oktober 1928', '1 Juni 1945'], correctIndex: 0 },
  { id: 'sej-2', topic: 'SEJARAH', question: 'Presiden pertama Republik Indonesia adalah?', options: ['Soeharto', 'Soekarno', 'Habibie', 'Hatta'], correctIndex: 1 },
  { id: 'sej-3', topic: 'SEJARAH', question: 'Candi Borobudur dibangun pada masa dinasti?', options: ['Majapahit', 'Sriwijaya', 'Syailendra', 'Mataram Islam'], correctIndex: 2 },
  { id: 'sej-4', topic: 'SEJARAH', question: 'Sumpah Pemuda diikrarkan pada tahun?', options: ['1908', '1928', '1945', '1949'], correctIndex: 1 },
  { id: 'sej-5', topic: 'SEJARAH', question: 'Perang Dunia II berakhir pada tahun?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2 },
  { id: 'sej-6', topic: 'SEJARAH', question: 'Kerajaan maritim besar di Sumatra abad ke-7 adalah?', options: ['Majapahit', 'Sriwijaya', 'Kutai', 'Tarumanegara'], correctIndex: 1 },
  { id: 'sej-7', topic: 'SEJARAH', question: 'Tokoh yang dijuluki Bapak Proklamator bersama Soekarno adalah?', options: ['Sjahrir', 'Tan Malaka', 'Mohammad Hatta', 'Ki Hajar Dewantara'], correctIndex: 2 },
  { id: 'sej-8', topic: 'SEJARAH', question: 'Tembok Berlin runtuh pada tahun?', options: ['1985', '1989', '1991', '1993'], correctIndex: 1 },
  { id: 'sej-9', topic: 'SEJARAH', question: 'Organisasi Budi Utomo berdiri pada tahun?', options: ['1905', '1908', '1912', '1920'], correctIndex: 1 },
  { id: 'sej-10', topic: 'SEJARAH', question: 'Piramida Giza dibangun oleh peradaban?', options: ['Romawi', 'Yunani', 'Mesir Kuno', 'Babilonia'], correctIndex: 2 },

  // ── GEOGRAFI ──
  { id: 'geo-1', topic: 'GEOGRAFI', question: 'Gunung tertinggi di dunia adalah?', options: ['K2', 'Kilimanjaro', 'Everest', 'Elbrus'], correctIndex: 2 },
  { id: 'geo-2', topic: 'GEOGRAFI', question: 'Samudra terluas di dunia adalah?', options: ['Atlantik', 'Hindia', 'Arktik', 'Pasifik'], correctIndex: 3 },
  // Dulu "pulau terbesar di Indonesia" — ambigu: pulau New Guinea utuh lebih luas dari
  // Borneo, jadi jawaban Papua juga masuk akal. Dipertegas ke luas wilayah Indonesia.
  { id: 'geo-3', topic: 'GEOGRAFI', question: 'Pulau dengan wilayah Indonesia terluas adalah?', options: ['Sumatra', 'Kalimantan', 'Papua', 'Sulawesi'], correctIndex: 1 },
  { id: 'geo-4', topic: 'GEOGRAFI', question: 'Sungai terpanjang di dunia adalah?', options: ['Amazon', 'Nil', 'Yangtze', 'Mississippi'], correctIndex: 1 },
  { id: 'geo-5', topic: 'GEOGRAFI', question: 'Negara dengan jumlah penduduk terbanyak di dunia (2024) adalah?', options: ['Tiongkok', 'Amerika Serikat', 'India', 'Indonesia'], correctIndex: 2 },
  { id: 'geo-6', topic: 'GEOGRAFI', question: 'Gurun terluas di dunia adalah?', options: ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], correctIndex: 1 },
  { id: 'geo-7', topic: 'GEOGRAFI', question: 'Garis khayal yang membagi Bumi menjadi belahan utara dan selatan adalah?', options: ['Garis bujur', 'Khatulistiwa', 'Garis tanggal', 'Meridian utama'], correctIndex: 1 },
  { id: 'geo-8', topic: 'GEOGRAFI', question: 'Ibu kota Australia adalah?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctIndex: 2 },
  { id: 'geo-9', topic: 'GEOGRAFI', question: 'Gunung berapi Krakatau terletak di selat?', options: ['Malaka', 'Sunda', 'Bali', 'Makassar'], correctIndex: 1 },
  { id: 'geo-10', topic: 'GEOGRAFI', question: 'Benua terkecil di dunia adalah?', options: ['Eropa', 'Antartika', 'Australia', 'Amerika Selatan'], correctIndex: 2 },

  // ── BAHASA ──
  { id: 'bhs-1', topic: 'BAHASA', question: 'Sinonim dari kata "gembira" adalah?', options: ['Sedih', 'Riang', 'Marah', 'Takut'], correctIndex: 1 },
  { id: 'bhs-2', topic: 'BAHASA', question: 'Antonim dari kata "temporer" adalah?', options: ['Sementara', 'Permanen', 'Sebentar', 'Singkat'], correctIndex: 1 },
  { id: 'bhs-3', topic: 'BAHASA', question: 'Kata baku yang benar adalah?', options: ['Apotik', 'Apotek', 'Aphotek', 'Apottek'], correctIndex: 1 },
  { id: 'bhs-4', topic: 'BAHASA', question: 'Peribahasa "besar pasak daripada tiang" berarti?', options: ['Rajin bekerja', 'Pengeluaran lebih besar dari pemasukan', 'Sombong', 'Berhati-hati'], correctIndex: 1 },
  { id: 'bhs-5', topic: 'BAHASA', question: '"Amanah" dalam bahasa Indonesia berarti?', options: ['Dapat dipercaya', 'Pemarah', 'Cerdas', 'Kuat'], correctIndex: 0 },
  { id: 'bhs-6', topic: 'BAHASA', question: 'Kalimat yang menggunakan majas personifikasi adalah?', options: ['Dia kuat seperti baja', 'Angin berbisik di telingaku', 'Aku sangat lapar', 'Harganya selangit'], correctIndex: 1 },
  { id: 'bhs-7', topic: 'BAHASA', question: 'Kata "unduh" adalah padanan dari?', options: ['Upload', 'Download', 'Install', 'Update'], correctIndex: 1 },
  { id: 'bhs-8', topic: 'BAHASA', question: 'Huruf vokal dalam bahasa Indonesia berjumlah?', options: ['4', '5', '6', '7'], correctIndex: 1 },
  { id: 'bhs-9', topic: 'BAHASA', question: 'Kata baku yang benar adalah?', options: ['Praktek', 'Praktik', 'Peraktik', 'Peraktek'], correctIndex: 1 },
  { id: 'bhs-10', topic: 'BAHASA', question: '"Ambigu" berarti?', options: ['Sangat jelas', 'Bermakna ganda', 'Tidak penting', 'Berlebihan'], correctIndex: 1 },

  // ── MATEMATIKA ──
  { id: 'mat-1', topic: 'MATEMATIKA', question: 'Berapa hasil dari 12 × 12?', options: ['124', '132', '144', '154'], correctIndex: 2 },
  { id: 'mat-2', topic: 'MATEMATIKA', question: 'Akar kuadrat dari 169 adalah?', options: ['11', '12', '13', '14'], correctIndex: 2 },
  { id: 'mat-3', topic: 'MATEMATIKA', question: '25% dari 200 adalah?', options: ['25', '40', '50', '75'], correctIndex: 2 },
  { id: 'mat-4', topic: 'MATEMATIKA', question: 'Bilangan prima setelah 7 adalah?', options: ['8', '9', '10', '11'], correctIndex: 3 },
  { id: 'mat-5', topic: 'MATEMATIKA', question: 'Jumlah sudut dalam segitiga adalah?', options: ['90°', '180°', '270°', '360°'], correctIndex: 1 },
  { id: 'mat-6', topic: 'MATEMATIKA', question: 'Hasil dari 7 + 6 × 2 adalah?', options: ['26', '19', '20', '13'], correctIndex: 1 },
  { id: 'mat-7', topic: 'MATEMATIKA', question: 'Nilai π (pi) mendekati?', options: ['3,14', '2,72', '1,61', '4,13'], correctIndex: 0 },
  { id: 'mat-8', topic: 'MATEMATIKA', question: 'Deret 2, 4, 8, 16, ... angka berikutnya adalah?', options: ['20', '24', '30', '32'], correctIndex: 3 },
  { id: 'mat-9', topic: 'MATEMATIKA', question: '15% dari 80 adalah?', options: ['8', '10', '12', '15'], correctIndex: 2 },
  { id: 'mat-10', topic: 'MATEMATIKA', question: 'Sebuah persegi memiliki sisi 9 cm. Luasnya adalah?', options: ['18 cm²', '36 cm²', '72 cm²', '81 cm²'], correctIndex: 3 },
];

/** PRNG deterministik (mulberry32) supaya soal harian sama untuk semua user. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tanggal WIB dalam format YYYY-MM-DD — kunci rotasi soal harian. */
export function wibDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Pilih soal hari ini: deterministik dari tanggal WIB, topik dishuffle
 * lalu ambil satu soal per topik sampai QUESTIONS_PER_DAY terpenuhi.
 */
export function pickDailyQuestions(dateKey: string): QuizQuestion[] {
  const seed = [...dateKey].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7) >>> 0;
  const rand = mulberry32(seed);

  const topics = [...new Set(QUIZ_BANK.map((q) => q.topic))];
  for (let i = topics.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [topics[i], topics[j]] = [topics[j], topics[i]];
  }

  return topics.slice(0, QUESTIONS_PER_DAY).map((topic) => {
    const pool = QUIZ_BANK.filter((q) => q.topic === topic);
    return pool[Math.floor(rand() * pool.length)];
  });
}
