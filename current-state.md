# Current State — BREAK APP (per 2026-07-05 08:24 WIB)

## Yang benar SEKARANG
- BREAK live di **https://break-id.vercel.app** (web) + **https://api-plum-beta.vercel.app/api/v1** (API), DB Neon — siap dipakai pengguna umum.
- Fitur live: auth (register/login/refresh/**reset password**), onboarding (gender + izin lokasi/notifikasi + telur pet), daily missions + upload bukti (auto-verify), streak Duolingon-style + streak recovery, pet egg system (EXP → stage → unlock fitur), coins + shop (8 item), daily report Wrapped-style, profile + badge, event 2x EXP, leaderboard, 1 mini game (Reaction), Chrome extension tracking (belum tersentuh sesi ini).
- Event **2x EXP** aktif di prod & lokal sampai **12 Juli 2026** (row di tabel Event).
- Email reset password **belum terkirim di prod** — RESEND_API_KEY belum diset; link hanya muncul di Vercel function logs. Di lokal link muncul di console API.

## Apa yang works (terverifikasi)
- `pnpm typecheck` bersih (api + web); **50 unit + 37 integration test PASS**; build web sukses.
- Smoke test manual: register → onboarding → report/shop/events di lokal & prod; alur reset password penuh (minta link → reset → login baru → reuse ditolak) di lokal; forgot-password prod merespons generik.

## Berubah sesi ini
- Commit `544a674` (fix adapter Prisma), `0e3a46d` (gamification), `4feb2aa` (reset password) — semua sudah di-push & deployed.
- 2 migration baru applied lokal + Neon prod: `add_gamification_features`, `add_password_reset_token`.

## Environment
- Branch: `main` (sinkron dengan origin `github.com/yanrane/BREAK-APP`).
- Vercel team `yanranes-projects`, project `api` & `web` (linked di `apps/*/.vercel`). Deploy manual `vercel --prod`; alias `break-id.vercel.app` harus di-set manual tiap deploy web.
- Env prod (api): DATABASE_URL, DIRECT_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL, CRON_SECRET, NODE_ENV. Belum ada: RESEND_API_KEY, MAIL_FROM (opsional).
- Env prod (web): VITE_API_BASE_URL.
- Lokal: Postgres 16 Homebrew (`brew services start postgresql@16`), DB `break_db`.

## Verification status
- Otomatis: unit 50 ✓, integration 37 ✓, typecheck ✓, vite build ✓.
- Manual: preview browser halaman landing/forgot-password ✓; curl end-to-end lokal & prod ✓.

## Jangan lupa
- `pnpm test:integration` MENGHAPUS semua data user di DB lokal.
- Adapter Prisma dipilih dari connection string (`neon.tech` → Neon, selain itu pg). Prisma 7 tidak auto-load `.env`.
- Multiplier event hanya memengaruhi EXP, bukan poin leaderboard (keputusan fairness).
- Akun lokal Tristan: `tristan.adhyaksa@gmail.com` / `TristanBaru123!` (bisa terhapus lagi kalau integration test jalan).
