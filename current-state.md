# Current State — per 2026-07-12 (sesi anti-curang misi)

## BREAK — Misi Anti-Curang (sesi 12 Jul — **LIVE DI PRODUCTION**, merge `a013280`)
- Request Tristan: sistem agar misi harian tidak bisa dicurangi, TANPA AI. Spec: `docs/superpowers/specs/2026-07-12-anti-cheat-missions-design.md`, plan: `docs/superpowers/plans/2026-07-12-anti-cheat-missions.md`.
- **Selesai & terverifikasi di dev**: timer server-authoritative (start/cancel/complete, `TIMER_NOT_ELAPSED` + sisa detik), bukti foto wajib kamera live in-app (komponen `CameraCapture`, tanpa file picker), dedup foto SHA-256 global (`PROOF_DUPLICATE`), Focus Mode fullscreen + pause overlay, halaman `/missions/:id/active`, status `IN_PROGRESS`, misi baru `no-phone-15min`, 4 misi "screenshot" dikonversi TIMER murni.
- Verifikasi: typecheck 4 project, 62 unit + 42 integration PASS (3x run), build sukses, smoke test browser end-to-end (register→onboarding→start→countdown resume terkalibrasi server→complete curang ditolak 400→complete sah VERIFIED→fallback kamera desktop).
- Bug ditemukan & difix saat smoke test: `await requestFullscreen()` bisa menggantung → transisi countdown tertahan (commit `271a014`).
- **Deployed 12 Jul**: merge ke main + push origin, migration `add_anti_cheat_missions` applied ke Neon, seed 11 misi prod terverifikasi via psql, api + web deployed, alias `break-id.vercel.app` di-set ke `web-bpn9epykb`. Smoke prod: landing/register/onboarding/missions bersih tanpa error console. Akun test prod: `jet-smoketest@break.local`. Sisa: tes kamera live + pause overlay di HP sungguhan setelah cron misi 00:00 WIB.

> Sesi 5 Jul malam (JET) full mengerjakan **RUMAH JAHIT RIANI**, bukan BREAK.

## RUMAH JAHIT RIANI (baru, sesi malam ini)
- **LIVE: https://rumah-jahit-riani.vercel.app** — website usaha jahit kebaya Bu Ni Made Riani (WA +62 881 037081372), Tukadmungga, Buleleng.
- Source: `79. WEBSITE RIANI/nanda-boutiq/` — React 19 + Vite 6 + Tailwind v4. **Belum git!**
- Yang works (terverifikasi): rebrand penuh, 4 gambar KIE AI + 4 foto produk di `public/images/` (semua 200 di prod), form Bespoke → buka WhatsApp Bu Riani dengan pesan terformat (dites end-to-end di browser + grep bundle prod), header sticky + font Italiana, meta/OG/favicon.
- Sudah DIHAPUS sesuai request Boss: grid produk RTW + cart (hanya 1 jenis kebaya), testimonial fiktif (anti-rekayasa), tombol Lihat Koleksi.
- Verifikasi: `tsc --noEmit` bersih, `vite build` sukses, curl prod 200, tes submit form (window.open stub) ✓.
- Detail lengkap: `30. CLAUDE/memory/projects/rumah-jahit-riani.md`.

## BREAK APP (tidak berubah sesi ini — state per 08:24 WIB)
- BREAK live di **https://break-id.vercel.app** (web) + **https://api-plum-beta.vercel.app/api/v1** (API), DB Neon — siap dipakai pengguna umum.
- Fitur live: auth (register/login/refresh/reset password), onboarding (gender + izin + telur pet), daily missions + upload bukti (auto-verify), streak Duolingo-style + recovery, pet egg system, coins + shop (8 item), daily report Wrapped-style, profile + badge, event 2x EXP (aktif s.d. **12 Jul 2026**), leaderboard, 1 mini game (Reaction), Chrome extension tracking.
- Email reset password **belum terkirim di prod** — RESEND_API_KEY belum diset; link hanya di Vercel function logs.
- Terverifikasi (pagi): typecheck bersih, 50 unit + 37 integration PASS, build sukses, smoke test lokal & prod.
- Commit terakhir `4feb2aa` + `ae9db38` (docs), branch `main` sinkron origin.

## Environment
- Vercel team `yanranes-projects`: project `api`, `web` (BREAK), `rumah-jahit-riani` (baru). Semua deploy manual.
- BREAK: alias `break-id.vercel.app` wajib `vercel alias set` manual tiap deploy web. Env api prod: DATABASE_URL, DIRECT_URL, JWT_*, FRONTEND_URL, CRON_SECRET, NODE_ENV (belum: RESEND_API_KEY).
- KIE AI: `KIE_API_KEY` valid di `77. BUKU ANAK HEBAT/.env` dan `~/.zshrc` (disamakan 5 Jul). Saldo ±8.738 kredit.
- Lokal: Postgres 16 Homebrew untuk BREAK; dev server Riani port 3000 (launch.json "riani").

## Jangan lupa
- `pnpm test:integration` (BREAK) MENGHAPUS semua data user di DB lokal.
- Repo Riani belum git — jangan andalkan rollback; `git init` adalah next step.
- Riani: gambar WAJIB dari `public/images/` (path `/images/...`) — path `/src/assets/` blank di produksi.
- Riani: Tailwind opacity modifier warna custom (`bg-ivory/95`) bug → transparan; pakai solid.
- Multiplier event BREAK hanya EXP, bukan poin leaderboard.
- Akun lokal Tristan: `tristan.adhyaksa@gmail.com` / `TristanBaru123!` (bisa terhapus kalau integration test jalan).
