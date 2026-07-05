# Handoff — 2026-07-05 08:24 WIB (JET)

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

## In progress
- (tidak ada — semua fitur yang diminta selesai & live)

## Next steps
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

## Infrastruktur
- **Production**: web `https://break-id.vercel.app` (+ `web-coral-ten-96.vercel.app`), API `https://api-plum-beta.vercel.app/api/v1`, DB Neon. Deploy manual `vercel --prod` per app (`apps/api`, `apps/web`), lalu `vercel alias set <deploy-url> break-id.vercel.app`. Migrasi prod: `vercel env pull` → `DATABASE_URL=$DIRECT_URL pnpm prisma migrate deploy`.
- **Lokal**: Postgres 16 via `brew services start postgresql@16` (tidak auto-start); API `pnpm --filter @break/api dev` (:3001), web (:5173). Akun test lokal: `tristan.adhyaksa@gmail.com` / `TristanBaru123!`.

## Blockers / risiko
- Email reset di prod belum terkirim (RESEND_API_KEY kosong) — lihat Next step 1.
- ⚠️ `pnpm test:integration` **menghapus semua user di DB lokal** `break_db` (setup test wipe tabel; sudah menghapus akun tristan sekali). Jangan simpan data penting di DB dev.

## Handoff prompt sesi berikutnya
*JET, BREAK gamification + reset password sudah LIVE di https://break-id.vercel.app (commit terakhir `4feb2aa`). Baca `42. BREAK APP/handoff.md`. P1: set RESEND_API_KEY di Vercel project api lalu redeploy supaya email reset terkirim. Ingat: deploy manual `vercel --prod` per app + re-alias break-id; integration test wipe DB lokal.*
