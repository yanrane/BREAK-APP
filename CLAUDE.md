# CLAUDE.md — BREAK (Brain Rot Elimination Awareness Kit)

> File ini adalah panduan kerja untuk Claude Code saat membangun proyek BREAK. Baca seluruhnya sebelum mulai menulis kode.

---

## 1. Project Overview

**BREAK** adalah sistem digital wellness yang terdiri dari dua komponen utama:

1. **AI Agent (Screen Time Monitor)** — memonitor penggunaan aplikasi media sosial user (Instagram, TikTok, YouTube Shorts, X/Twitter, Facebook), mendeteksi pelanggaran batas waktu harian, dan mengirim notifikasi yang mengarahkan user masuk ke website BREAK.
2. **Web Application (BREAK Platform)** — website intervensi yang menampilkan:
   - Edukasi tentang bahaya brain rot
   - Misi harian (daily challenges) berbasis checklist dengan upload bukti foto
   - Sistem poin + leaderboard + cooldown antar misi
   - Mini games untuk latihan fokus (reaction game, fast clicking, pattern matching)

**Tujuan utama**: memutus loop doomscrolling dan mendorong aktivitas dunia nyata seperti jogging, membaca, keluar rumah, dan interaksi sosial.

**User persona**: pengguna media sosial usia 15-35 yang merasa kecanduan scrolling dan ingin membangun kebiasaan lebih sehat.

---

## 2. Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State management**: Zustand (lightweight, cukup untuk scope ini)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts** (untuk analytics usage): Recharts

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Auth**: JWT (access + refresh token) + bcrypt
- **File upload**: Multer + storage lokal di `/uploads` (Phase 1), S3-compatible di Phase 2
- **Scheduler**: node-cron untuk reset misi harian & cooldown cleanup

### AI Agent / Notifier
- **Browser extension** (Phase 1) — Chrome Extension Manifest V3 untuk memonitor tab aktif di browser
- **Desktop agent** (Phase 2, optional) — Electron app untuk memonitor aplikasi sistem
- **Notifikasi**: Web Push API (VAPID) + Chrome Notification API + fallback Telegram bot

### Deployment
- **Development**: lokal di Mac Mini M4 (`/Users/yanrane/Projects/break/`)
- **Production**: PM2 + Nginx reverse proxy di Mac Mini (24/7)
- **Database**: PostgreSQL lokal di Mac Mini
- **Domain**: subdomain dari domain utama (mis. `break.yanrane.dev`)

---

## 3. Repository Structure

```
break/
├── apps/
│   ├── web/                      # React frontend
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI (shadcn-based)
│   │   │   ├── features/         # Feature modules (missions, games, leaderboard)
│   │   │   ├── pages/            # Route-level pages
│   │   │   ├── hooks/            # Custom hooks
│   │   │   ├── lib/              # Utils, API client, Zod schemas
│   │   │   ├── store/            # Zustand stores
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   │
│   ├── api/                      # Express backend
│   │   ├── src/
│   │   │   ├── routes/           # Route handlers
│   │   │   ├── services/         # Business logic
│   │   │   ├── middleware/       # Auth, error handler, validator
│   │   │   ├── jobs/             # Cron jobs (daily reset, cooldown)
│   │   │   ├── lib/              # Prisma client, push notification, utils
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── uploads/              # User mission proofs (gitignored)
│   │
│   └── extension/                # Chrome extension (AI Agent)
│       ├── src/
│       │   ├── background.ts     # Service worker: track active tabs
│       │   ├── content.ts        # Content script: detect social media
│       │   ├── popup/            # Extension popup UI
│       │   └── options/          # Settings page
│       ├── manifest.json
│       └── vite.config.ts
│
├── packages/
│   └── shared/                   # Shared types, Zod schemas, constants
│       └── src/
│
├── docs/
│   ├── architecture.md
│   ├── api-spec.md
│   └── extension-permissions.md
│
├── .env.example
├── docker-compose.yml            # Postgres + Redis (optional, Phase 2)
├── pnpm-workspace.yaml
├── package.json
└── CLAUDE.md                     # file ini
```

> **Catatan**: gunakan **pnpm workspaces** untuk monorepo. Hindari npm/yarn agar konsisten.

---

## 4. Data Model (Prisma Schema — simplified)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String
  avatarUrl     String?
  totalPoints   Int      @default(0)
  currentStreak Int      @default(0)
  createdAt     DateTime @default(now())

  missions      UserMission[]
  usageLogs     UsageLog[]
  gameScores    GameScore[]
  settings      UserSettings?
}

model UserSettings {
  userId             String  @id
  user               User    @relation(fields: [userId], references: [id])
  dailyLimitMinutes  Int     @default(60)       // total screen time limit
  trackedDomains     String[]                    // ["instagram.com", "tiktok.com", ...]
  notificationEnabled Boolean @default(true)
  telegramChatId     String?
}

model Mission {
  id           String   @id @default(cuid())
  slug         String   @unique                  // "jogging-15min", "read-book-20pages"
  title        String
  description  String
  category     MissionCategory                   // PHYSICAL, MENTAL, SOCIAL, CREATIVE
  points       Int
  requiresProof Boolean @default(true)
  cooldownHours Int     @default(24)
  isActive     Boolean  @default(true)

  userMissions UserMission[]
}

model UserMission {
  id           String   @id @default(cuid())
  userId       String
  missionId    String
  status       MissionStatus                     // ASSIGNED, COMPLETED, VERIFIED, REJECTED
  proofUrl     String?
  pointsEarned Int      @default(0)
  assignedAt   DateTime @default(now())
  completedAt  DateTime?
  verifiedAt   DateTime?

  user         User     @relation(fields: [userId], references: [id])
  mission      Mission  @relation(fields: [missionId], references: [id])

  @@index([userId, assignedAt])
}

model UsageLog {
  id         String   @id @default(cuid())
  userId     String
  domain     String
  seconds    Int
  loggedAt   DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])

  @@index([userId, loggedAt])
}

model GameScore {
  id        String   @id @default(cuid())
  userId    String
  gameType  GameType                             // REACTION, FAST_CLICK, PATTERN_MATCH
  score     Int
  playedAt  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

enum MissionCategory { PHYSICAL MENTAL SOCIAL CREATIVE }
enum MissionStatus   { ASSIGNED COMPLETED VERIFIED REJECTED }
enum GameType        { REACTION FAST_CLICK PATTERN_MATCH }
```

---

## 5. Core Features — Spesifikasi Detail

### 5.1 AI Agent (Chrome Extension)

**Fungsi**: tracking + nudging.

**Tracking logic**:
- Background service worker mendengarkan event `chrome.tabs.onActivated` dan `chrome.tabs.onUpdated`.
- Cek apakah URL aktif match dengan `trackedDomains` user (diambil dari API `/api/settings`).
- Hitung durasi tab aktif pakai timestamp delta. Agregat per hari.
- Kirim batch ke backend `POST /api/usage-logs` setiap 60 detik.

**Notifikasi (nudging)**:
- Jika akumulasi harian melewati `dailyLimitMinutes` (misal 60 menit), trigger notifikasi:
  - **Level 1 (soft)** — notifikasi browser: "Eh, udah 60 menit scrolling. Cek BREAK dulu yuk."
  - **Level 2 (medium)** — setelah +30 menit over limit: notifikasi dengan tombol "Buka BREAK sekarang" (CTA ke misi hari ini).
  - **Level 3 (hard)** — setelah +60 menit over limit: fullscreen overlay di tab media sosial yang memblokir konten dan memaksa klik "Saya paham" untuk dismiss. Overlay memuat ringkasan dampak brain rot dan link misi.

**Privacy**: semua tracking local-first. Data hanya dikirim ke backend milik user sendiri. Tidak ada third-party analytics.

### 5.2 Daily Missions (Checklist)

**Rules**:
- Setiap jam 00:00 WIB, cron job `assignDailyMissions` pilih 3 misi random per user dari pool `Mission` yang `isActive = true`.
- Misi dibagi minimal 1 dari masing-masing kategori PHYSICAL/MENTAL/SOCIAL.
- User submit bukti via upload foto (max 5MB, JPG/PNG/WEBP).
- Status awal `ASSIGNED` → user tandai selesai + upload → `COMPLETED` → (Phase 2) moderator verify → `VERIFIED` atau `REJECTED`. Untuk Phase 1, auto-verify setelah upload valid.

**Cooldown**: setelah misi `VERIFIED`, misi yang sama tidak bisa diassign ulang selama `cooldownHours` (default 24 jam).

**Contoh pool misi**:
| Slug | Title | Kategori | Points | Cooldown |
|------|-------|----------|--------|----------|
| jogging-15min | Jogging minimal 15 menit | PHYSICAL | 20 | 24 |
| read-20pages | Baca buku fisik 20 halaman | MENTAL | 15 | 24 |
| call-family | Telepon anggota keluarga 10 menit | SOCIAL | 10 | 48 |
| outdoor-photo | Foto pemandangan di luar rumah | PHYSICAL | 10 | 24 |
| handwrite-journal | Tulis jurnal tangan 1 halaman | CREATIVE | 15 | 24 |
| meditation-10min | Meditasi 10 menit (bukti: timer app) | MENTAL | 15 | 24 |
| cook-meal | Masak 1 menu sendiri | CREATIVE | 20 | 48 |

### 5.3 Point System + Leaderboard

- Setiap mission `VERIFIED` → tambah `points` ke `User.totalPoints`.
- Bonus streak: jika user complete ≥1 misi per hari selama 7 hari berturut-turut, bonus +50.
- Leaderboard: `GET /api/leaderboard?period=weekly|monthly|alltime` — return top 50 users sorted by total points.
- Tampilkan avatar + username + points di frontend. Privasi: user bisa opt-out via settings (`showOnLeaderboard: false`).

### 5.4 Mini Games

**Game 1 — Reaction Time**:
- Tunggu beberapa detik random (2-6s), layar berubah warna, user klik secepat mungkin.
- Score = 1000 - reactionTimeMs (capped 0-1000).
- 5 round per sesi, ambil rata-rata.

**Game 2 — Fast Clicking (CPS Test)**:
- Klik tombol sebanyak mungkin dalam 10 detik.
- Score = total clicks.

**Game 3 — Pattern Match**:
- Tampilkan grid 4x4 dengan urutan warna, user hafalkan, lalu reproduksi dengan klik.
- Level naik setiap berhasil (grid bertambah).
- Score = level tertinggi dicapai.

**Integrasi dengan poin**: setiap sesi game beri 1-5 poin (tergantung score), dengan cap 20 poin/hari dari game supaya tidak jadi loophole grinding.

---

## 6. API Endpoints (REST)

Prefix: `/api/v1`

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Daftar user baru | - |
| POST | `/auth/login` | Login, return JWT | - |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| GET | `/me` | Profile user current | JWT |
| PATCH | `/me/settings` | Update settings (limit, domains) | JWT |
| POST | `/usage-logs` | Terima batch log dari extension | JWT (API key khusus) |
| GET | `/usage-logs/summary?date=YYYY-MM-DD` | Ringkasan harian | JWT |
| GET | `/missions/today` | 3 misi hari ini | JWT |
| POST | `/missions/:userMissionId/complete` | Tandai selesai + upload proof | JWT, multipart |
| GET | `/missions/history?page=1` | Riwayat misi user | JWT |
| GET | `/leaderboard?period=weekly` | Ranking top 50 | JWT |
| POST | `/games/submit` | Submit score game | JWT |
| GET | `/games/my-stats` | Statistik game user | JWT |

**Response format standar**:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "MISSION_ALREADY_COMPLETED", "message": "..." } }
```

---

## 7. Development Phases

### Phase 1 — MVP (target: 3 minggu)
- [ ] Setup monorepo pnpm + Prisma + Postgres
- [ ] Auth (register/login/JWT)
- [ ] Daily missions CRUD + auto-assign cron
- [ ] Upload proof flow (tanpa moderasi, auto-verify)
- [ ] Point system + leaderboard weekly
- [ ] Chrome extension: track + send usage logs
- [ ] Browser notification level 1 & 2
- [ ] 1 mini game (Reaction Time)
- [ ] UI: landing + dashboard + misi hari ini + leaderboard

### Phase 2 — Enhancement
- [ ] Fullscreen blocker overlay (level 3)
- [ ] 2 mini game tambahan (Fast Click + Pattern Match)
- [ ] Manual verification (admin panel)
- [ ] Telegram bot integration sebagai fallback notifier
- [ ] Analytics dashboard (chart penggunaan harian/mingguan)
- [ ] Streak bonus + achievement badges

### Phase 3 — Scaling (optional)
- [ ] S3-compatible storage untuk proof
- [ ] Electron desktop agent (untuk user yang pakai app native)
- [ ] Public API untuk integrasi pihak ketiga
- [ ] Multi-language (ID + EN)

---

## 8. Coding Conventions

### General
- **TypeScript strict mode** wajib di semua apps/packages.
- **ESLint** config: `@typescript-eslint/recommended` + `eslint-plugin-react-hooks`.
- **Prettier** formatting, 2-space indent, single quotes, trailing comma.
- **Commit style**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).

### Frontend
- Satu komponen per file. Export default untuk page, named export untuk util.
- Tailwind: ekstrak class panjang ke `cn()` helper (pakai `clsx` + `tailwind-merge`).
- Form validation: selalu pakai Zod schema, infer type dari schema.
- API calls: centralized di `lib/api.ts`, jangan fetch langsung di komponen.

### Backend
- Route handler tipis, business logic di `services/`.
- Error handling: custom `AppError` class + global error middleware.
- Validasi input: Zod schema di middleware sebelum masuk service.
- Jangan expose Prisma error mentah ke response — map ke error code domain.

### Naming
- Files: `kebab-case.ts` untuk util, `PascalCase.tsx` untuk komponen React.
- DB tables: plural (`users`, `missions`, `user_missions`).
- API paths: kebab-case, plural resource (`/api/v1/usage-logs`).
- Env vars: `UPPER_SNAKE_CASE`.

---

## 9. Environment Variables

File `.env` (jangan commit, gunakan `.env.example`):

```bash
# Backend
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://user:pass@localhost:5432/break_db"
JWT_ACCESS_SECRET=<generate-32char-random>
JWT_REFRESH_SECRET=<generate-32char-random>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5

# Push notification (VAPID keys)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@break.app

# Telegram (optional)
TELEGRAM_BOT_TOKEN=

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_VAPID_PUBLIC_KEY=  # same as backend VAPID_PUBLIC_KEY

# Extension
EXTENSION_API_BASE=http://localhost:3001/api/v1
```

---

## 10. Testing Strategy

- **Unit**: Vitest untuk util + service layer. Target coverage ≥ 70% pada `services/`.
- **Integration**: Supertest untuk API endpoints, pakai test database terpisah.
- **E2E** (Phase 2): Playwright untuk flow kritis (register → complete mission → leaderboard).
- **Extension**: manual testing checklist di `docs/extension-test-plan.md`.

Script standar:
```bash
pnpm test              # all tests
pnpm test:unit         # only unit
pnpm test:integration  # only integration
pnpm test:watch        # watch mode
```

---

## 11. Build & Run

### Development
```bash
# Root
pnpm install
pnpm db:migrate        # prisma migrate dev
pnpm db:seed           # seed mission pool

# Jalan paralel
pnpm --filter @break/api dev       # backend di :3001
pnpm --filter @break/web dev       # frontend di :5173
pnpm --filter @break/extension build  # lalu load unpacked di chrome://extensions
```

### Production (Mac Mini M4)
```bash
pnpm build                          # build semua apps
pm2 start ecosystem.config.js       # jalankan api + cron dengan PM2
pm2 save
pm2 startup                         # auto-start on boot
```

Nginx config sudah ada di `/etc/nginx/sites-available/break`. Reload dengan `sudo nginx -s reload`.

---

## 12. Security Checklist

- [ ] JWT secret ≥ 32 karakter random, rotasi tiap 90 hari
- [ ] Rate limit pada auth endpoints (`express-rate-limit`): 5 req/min untuk login
- [ ] CORS whitelist: hanya `break.yanrane.dev` dan `localhost:5173` di dev
- [ ] Helmet.js untuk security headers
- [ ] Validasi MIME type + magic bytes pada upload (pakai `file-type` package)
- [ ] Sanitize filename upload, simpan dengan UUID bukan nama asli
- [ ] SQL injection: aman karena Prisma, tapi tetap validasi input di layer Zod
- [ ] XSS: React escape by default, hati-hati kalau pakai `dangerouslySetInnerHTML`
- [ ] Extension permissions: minimal — hanya `tabs`, `storage`, `notifications`, `activeTab`

---

## 13. Working with Claude Code — Aturan Main

1. **Jangan ubah file yang tidak diminta.** Fokus pada task yang diminta user di prompt sekarang.
2. **Selalu baca `CLAUDE.md` dan `prisma/schema.prisma` dulu** sebelum buat perubahan struktural.
3. **Jika ragu pada keputusan arsitektur**, tanya user dulu — jangan asumsikan.
4. **Commit per fitur, bukan per file.** Satu commit = satu unit logis yang bisa di-revert bersih.
5. **Test dulu sebelum deklarasi selesai.** Minimal jalankan `pnpm typecheck` + `pnpm test` untuk file terkait.
6. **Dokumentasi inline**: function publik wajib JSDoc/TSDoc. Function internal boleh skip kalau sudah self-explanatory.
7. **Bahasa komentar & commit message**: Bahasa Indonesia untuk domain-specific terms, Bahasa Inggris untuk teknis umum. Konsisten dalam satu file.
8. **Saat menambah dependency baru**, justifikasi di commit message — kenapa perlu, alternatif yang sudah dipertimbangkan.

---

## 14. Reference Context (Brain Rot — Domain Knowledge)

"Brain rot" adalah istilah populer untuk degradasi kognitif akibat konsumsi konten pendek yang berlebihan (TikTok, Reels, Shorts). Research relevan yang bisa dikutip di halaman edukasi:

- **Dopamine overstimulation**: konten pendek memicu dopamine hit frequent, menurunkan baseline motivasi untuk aktivitas low-stimulation (baca buku, olahraga).
- **Attention span degradation**: studi menunjukkan pengguna heavy short-form content mengalami penurunan rentang fokus sustained.
- **Sleep disruption**: blue light + rangsangan emosional sebelum tidur mengganggu fase REM.
- **FOMO & anxiety loop**: algoritma social media design untuk memaksimalkan engagement, sering memicu kecemasan sosial.

Konten edukasi di landing page BREAK harus factual (hindari klaim medis berlebihan), sertakan sumber (research paper / artikel kredibel), dan tawarkan aksi konkret bukan cuma warning.

---

## 15. Success Metrics (internal)

Yang dipantau untuk validasi produk:
- **DAU/WAU ratio**: retention engagement
- **Mission completion rate**: % user yang selesaikan ≥1 misi dari 3 yang assigned
- **Streak distribution**: berapa % user capai streak ≥7 hari
- **Time-to-click-notification**: berapa detik user merespons notifikasi level 2
- **Screen time reduction**: delta rata-rata screen time mingguan per user (opt-in anonymized)

---

*Last updated: 19 April 2026 — versi 1.0*
