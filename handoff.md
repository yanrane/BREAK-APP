# Handoff — 2026-07-12 (JET) — MISI ANTI-CURANG LIVE

## Goal sesi
Request Tristan: konsep "AI Companion" BREAK. Diputuskan bareng Tristan: bangun **sub-proyek pertama — misi anti-curang TANPA AI** (timer server, kamera live, dedup foto, focus mode). Sisanya (Daily Reflection, Brain Games, animasi, Anti-Exit penuh) jadi backlog.

## Selesai ✅ (semua LIVE di production)
1. Spec `docs/superpowers/specs/2026-07-12-anti-cheat-missions-design.md` + plan `docs/superpowers/plans/2026-07-12-anti-cheat-missions.md` (disetujui Tristan).
2. Eksekusi subagent-driven 12 task: schema (ProofType/durationMinutes/startedAt/proofHash unique/IN_PROGRESS + migration), seed 11 misi (no-phone-15min baru; 4 misi screenshot → TIMER), missionGuard TDD, upload opsional + SHA-256, service & routes start/cancel/complete, 5 integration test baru.
3. Web: MissionSession (countdown terkalibrasi serverNow, fullscreen focus mode, pause overlay Lanjutkan/Batalkan, beforeunload), CameraCapture live-only (tanpa galeri), MissionCard "Start Mission"/"Lanjutkan Sesi", ProofUploadModal dihapus.
4. Verifikasi: typecheck, 62 unit + 42 integration (3x), build, smoke test browser end-to-end lokal (complete curang → 400, complete sah → VERIFIED). 2 bug nyata ditemukan & difix saat verifikasi: `await requestFullscreen` menggantung (271a014) + temuan final review (blob yatim, race 409, rekalibrasi countdown — e9d7380).
5. Deploy: merge `a013280` → main, push origin, migrate+seed Neon (11 misi terverifikasi psql), api+web deploy, alias `break-id.vercel.app` → `web-bpn9epykb`. Smoke prod bersih.

## Next steps
1. **P1**: Tes full flow misi + kamera live + pause di HP sungguhan (akun `jet-smoketest@break.local`, misi ter-assign setelah cron 00:00 WIB).
2. **P1 lama**: RESEND_API_KEY masih belum diset (email reset password prod).
3. **P2**: Backlog AI Companion — Daily Reflection duluan (paling kecil). ⚠️ Event 2x EXP berakhir 12 Jul — perpanjang via SQL Neon kalau mau lanjut.
4. **P3**: Follow-up minor final review (lihat tasks.md).

---

# [ARSIP] Handoff — 2026-07-05 22:25 WIB (JET)

> ⚠️ Sesi ini TIDAK menyentuh BREAK APP sama sekali — seluruh sesi mengerjakan **WEBSITE RUMAH JAHIT RIANI** (detour dari cwd ini). Handoff BREAK dari sesi pagi (08:24 WIB) masih 100% valid, lihat bagian bawah.

## Goal sesi
Bangun & luncurkan website usaha jahit Bu Ni Made Riani: pindahkan draft `nanda-boutiq` dari AI Studio, rebrand jadi RUMAH JAHIT RIANI, lengkapi aset, rapikan sesuai bisnis nyata (1 jenis kebaya, tanpa e-commerce), deploy ke Vercel, sambungkan order ke WhatsApp.

## Selesai ✅
1. **Pindah folder** `~/nanda-boutiq` → `79. WEBSITE RIANI/nanda-boutiq/`.
2. **Rebrand total** Nanda Boutiq → Rumah Jahit Riani (25+ titik: title, header, footer, metadata, localStorage keys, email placeholder).
3. **4 gambar pengganti** (hero, detail sulaman, lookbook, bespoke) di-generate via **KIE AI nano-banana-pro** (~72 kredit; saldo tersisa ±8.738) — gambar draft lama expired (googleusercontent). Disimpan permanen.
4. **Data bisnis nyata**: alamat Jl. Perwira Dharma, Tukadmungga (depan Balai Banjar Dinas Dharmayasa), Buleleng; WA Ni Made Riani +62 881 037081372 (klik → wa.me); jam WITA; hapus telepon Jakarta palsu.
5. **Penyederhanaan sesuai kondisi bisnis** (request Boss): grid 4 produk RTW + filter + cart + modal DIHAPUS (hanya 1 jenis kebaya); **testimonial fiktif DIHAPUS** (anti-rekayasa); CTA hero jadi "Pesan Jahit Kebaya" → form Bespoke.
6. **Font logo** → Italiana (via Google Fonts, `--font-brand`); header `fixed`→`sticky` (fix logo ketutup banner); fix `bg-ivory/95` yang render transparan → solid.
7. **Audit redesign**: scroll smooth, focus ring gold, text-wrap balance, meta description + OG tags + favicon "R", lang="id", banner copy "MENERIMA JAHIT KEBAYA BALI & BUSANA WANITA".
8. **Fix path produksi**: semua gambar dipindah `src/assets/images/` → `public/images/` dengan path `/images/...` (path `/src/assets/` = blank di build produksi).
9. **DEPLOY LIVE: https://rumah-jahit-riani.vercel.app** (project `rumah-jahit-riani`, akun `yanrane`).
10. **Form Bespoke → WhatsApp**: submit membuka wa.me Bu Riani dengan pesan terformat (nama/acara/siluet/budget/tanggal/catatan); terverifikasi di browser & bundle produksi. + fix default budget & markdown asterisk mentah.
11. **KIE_API_KEY di `~/.zshrc` disamakan** dengan key valid (sumber kebenaran: `77. BUKU ANAK HEBAT/.env`).
12. **Memory JET**: `30. CLAUDE/memory/projects/rumah-jahit-riani.md` + index MEMORY.md.

## In progress
- (tidak ada)

## Next steps (RIANI)
1. **P2**: Pasang foto asli Boss (banner "rumah jahit Riani" + foto kebaya merah/emas ber-watermark) — file harus di-drop ke `79. WEBSITE RIANI/` atau INBOX dulu, lampiran chat tidak bisa disimpan JET.
2. **P2**: Ganti link Instagram/Facebook footer yang masih placeholder (instagram.com / facebook.com) dengan akun asli Bu Riani, atau hapus ikonnya.
3. **P3**: `git init` + commit repo Riani (belum ada version control! "kembalikan dari git history" di komentar kode belum berlaku).
4. **P3**: Custom domain kalau Boss mau (mis. rumahjahitriani.com) via `vercel domains`.
5. (BREAK, P1 dari sesi pagi): Set `RESEND_API_KEY` di Vercel project `api` — lihat handoff BREAK di bawah.

## Files changed (semua di `79. WEBSITE RIANI/nanda-boutiq/`, TANPA git)
- `index.html` — title/meta/OG/favicon/lang
- `src/index.css` — font Italiana, `--font-brand`, scroll smooth, focus ring, text-wrap
- `src/App.tsx` — banner copy, hapus Testimonials & prop cart/koleksi
- `src/components/Hero.tsx` — CTA baru, object-top, gulir-link, eyebrow
- `src/components/Header.tsx` — sticky, font-brand, hapus ikon cart, bg solid
- `src/components/Collection.tsx` — ditulis ulang: showcase 1 kebaya signature (grid produk dihapus)
- `src/components/Footer.tsx` — alamat/WA/WITA/nav label, wa.me link
- `src/components/BespokeForm.tsx` — submit → WhatsApp Bu Riani, fix budget default & asterisk
- `src/components/Testimonials.tsx` — **DIHAPUS**; `src/data.ts` — TESTIMONIALS dihapus, path gambar `/images/`
- `public/images/*.png` — 8 gambar (4 produk lama + 4 generate KIE)
- Di 42. BREAK APP: `.claude/launch.json` +config "riani" (dev server port 3000)

## Infrastruktur
- **Prod**: https://rumah-jahit-riani.vercel.app — Vercel `yanranes-projects/rumah-jahit-riani`, deploy manual `vercel deploy --prod --yes` dari folder project (sudah `vercel link`).
- **Dev**: `npm run dev` port 3000, atau preview server "riani" via launch.json BREAK APP.
- Repo Riani **belum git** — hati-hati, tidak ada history untuk rollback.

## Blockers / risiko
- Tidak ada blocker. Risiko kecil: tanpa git, perubahan tak ter-track (Next step 3).
- Bug Tailwind v4 project ini: opacity modifier warna custom (`bg-ivory/95`) menghasilkan transparan — hindari, pakai warna solid (tercatat di known-issues).

## Handoff prompt sesi berikutnya
*JET, website Rumah Jahit Riani sudah LIVE di https://rumah-jahit-riani.vercel.app (source: `79. WEBSITE RIANI/nanda-boutiq`, belum git). Baca `30. CLAUDE/memory/projects/rumah-jahit-riani.md`. Prioritas kalau dilanjut: pasang foto asli Bu Riani (minta Boss drop file), ganti/hapus link sosmed placeholder di footer, dan `git init` repo. Untuk BREAK APP: P1 masih set RESEND_API_KEY (lihat bagian BREAK di handoff.md).*

---
---

# [MASIH VALID] Handoff BREAK — 2026-07-05 08:24 WIB (JET)

## Goal sesi
Request Tristan: bangun paket gamification BREAK (onboarding, streak, pet streak, daily report, event, profile, in-app currency/shop), deploy ke Vercel agar bisa dipakai pengguna lain, lalu tambah reset password.

## Selesai ✅
1. **Onboarding** — halaman `/onboarding` pasca-register: pilih gender + izin lokasi & notifikasi browser; `POST /me/onboarding` simpan gender + buat telur pet.
2. **Streak ala Duolingo** — +1 per hari ada misi VERIFIED (batas hari WIB), putus kalau bolong; streak lama disimpan di `User.lastBrokenStreak` untuk recovery.
3. **Pet Streak (egg system)** — EXP misi menumbuhkan pet: EGG(100)→BABY(500)→TEEN(1500)→ADULT; rarity di-roll saat menetas berbobot EXP user; fitur unlock per stage (emote/outfit/cosmetic). Logika pure-function di `apps/api/src/lib/progression.ts`.
4. **Daily Report** gaya Spotify Wrapped — `GET /me/report` (endpoint agregat) + halaman `/report`.
5. **Event 2x EXP** — model `Event`, `GET /events/active`, banner di Layout, multiplier hanya ke EXP (poin leaderboard tidak). Event seed aktif s.d. **12 Jul 2026** (lokal & prod).
6. **Profile** `/profile` — ranking global, join date, streak, pet + progress bar, koleksi item, badge computed client-side.
7. **Coins + Shop** — coins = poin misi; `/shop` (items + buy); Streak Recovery consumable 100 coins; item gated stage pet. Katalog hardcoded di `apps/api/src/lib/shopItems.ts`.
8. **Reset password** — `POST /auth/forgot-password` (token SHA-256 hash, TTL 1 jam, sekali pakai, respons generik, rate limit 3/mnt) + `POST /auth/reset-password` (cabut semua refresh token). Email via Resend API, fallback log console. Halaman `/forgot-password` + `/reset-password` + link di Login.
9. **Fix infra pre-existing** — integration test & seed rusak sejak Prisma 7/Neon: tambah `@prisma/adapter-pg` (lokal) vs Neon (prod, deteksi `neon.tech`), `dotenv/config` di `lib/prisma.ts`, `datasource.url` di `prisma.config.ts`.
10. **Deploy production** — 2 migration applied ke Neon, seed prod OK, API+web deployed, alias `break-id.vercel.app` → build terbaru (alias TIDAK otomatis pindah, harus `vercel alias set` tiap deploy web).

## Next steps (BREAK)
1. **P1: Set `RESEND_API_KEY`** di Vercel project `api` (production) supaya email reset benar-benar terkirim — daftar resend.com gratis, lalu `vercel env add RESEND_API_KEY production` + redeploy api. Tanpa ini link reset hanya muncul di Vercel function logs.
2. P2: Admin endpoint/panel untuk buat Event baru (sekarang hanya via SQL Neon / seed).
3. P2: UI perayaan saat telur menetas / naik stage (sekarang perubahan diam-diam saat refresh).
4. P3: Render emote/outfit yang dibeli pada tampilan pet; multi-pet; achievement server-side.
5. P3: Streak bonus +50 (spec CLAUDE.md §5.3) belum diimplementasi — konfirmasi dulu apakah masih diinginkan.

## Files changed (commit `544a674`, `0e3a46d`, `4feb2aa`)
- `apps/api/prisma/schema.prisma` + 2 migrations — field gamification User, model Pet/Event/PasswordResetToken, enum Gender/PetStage/PetRarity
- `apps/api/src/lib/{progression,shopItems,mailer}.ts` (+ `progression.test.ts`) — logika inti streak/pet/rarity, katalog shop, pengirim email
- `apps/api/src/lib/prisma.ts`, `prisma.config.ts`, `prisma/seed.ts` — dual adapter pg/Neon, dotenv, seed event
- `apps/api/src/services/{progressionService,reportService,shopService}.ts` — rewards misi, report agregat, pembelian
- `apps/api/src/services/{missionService,authService}.ts` — integrasi rewards ke completeMission; forgot/resetPassword
- `apps/api/src/routes/{me,shop,events,auth,index}.ts` — endpoint baru
- `apps/web/src/pages/{Onboarding,Profile,Report,Shop,ForgotPassword,ResetPassword}.tsx` — halaman baru
- `apps/web/src/features/profile/useReport.ts` — hook data + helper emoji pet
- `apps/web/src/{App,components/Layout,pages/Register,pages/Login,lib/schemas}.tsx|ts` — routing, nav, banner event, redirect onboarding, link lupa password

## Infrastruktur BREAK
- **Production**: web `https://break-id.vercel.app` (+ `web-coral-ten-96.vercel.app`), API `https://api-plum-beta.vercel.app/api/v1`, DB Neon. Deploy manual `vercel --prod` per app (`apps/api`, `apps/web`), lalu `vercel alias set <deploy-url> break-id.vercel.app`. Migrasi prod: `vercel env pull` → `DATABASE_URL=$DIRECT_URL pnpm prisma migrate deploy`.
- **Lokal**: Postgres 16 via `brew services start postgresql@16` (tidak auto-start); API `pnpm --filter @break/api dev` (:3001), web (:5173). Akun test lokal: `tristan.adhyaksa@gmail.com` / `TristanBaru123!`.

## Blockers / risiko BREAK
- Email reset di prod belum terkirim (RESEND_API_KEY kosong) — lihat Next step 1.
- ⚠️ `pnpm test:integration` **menghapus semua user di DB lokal** `break_db` (setup test wipe tabel; sudah menghapus akun tristan sekali). Jangan simpan data penting di DB dev.
