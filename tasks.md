# Tasks — BREAK APP (+ RIANI)

## Active — BREAK
- **P1** Deploy misi anti-curang ke production (branch `feat/anti-cheat-missions` → merge → migrate Neon + seed + deploy api/web + alias) — MENUNGGU KONFIRMASI Tristan/Boss. Smoke test kamera live + pause overlay di HP setelah deploy.
- **P2** Backlog AI Companion Tristan (12 Jul), siklus berikutnya: Daily Reflection (paling kecil, data sudah ada di `/me/report`), Brain Training Games (Sudoku dkk), animasi UX (streak/pet/misi/micro-interaction), Anti-Exit penuh (banner app-wide).
- **P1** Set `RESEND_API_KEY` di Vercel project `api` (production) + redeploy — email reset password belum terkirim ke user (link hanya di function logs). Butuh akun resend.com (gratis 3.000 email/bln).
- **P2** Admin endpoint/panel untuk membuat Event baru (sekarang hanya via SQL Neon; event seed berakhir 12 Jul 2026).
- **P2** UI perayaan pet menetas / naik stage (sekarang perubahan hanya terlihat setelah refresh).
- **P3** Render emote/outfit/cosmetic yang dibeli pada tampilan pet.
- **P3** Streak bonus +50 per 7 hari (spec CLAUDE.md §5.3) — konfirmasi dulu masih diinginkan atau tidak.
- **P3** Phase 2 backlog lama: Fast Click + Pattern Match games, fullscreen blocker level 3, Telegram fallback notifier, analytics dashboard, admin verification.

## Active — RUMAH JAHIT RIANI (`79. WEBSITE RIANI/nanda-boutiq`, live: rumah-jahit-riani.vercel.app)
- **P2** Pasang foto asli (banner + foto kebaya watermark by:rumahjahitriani) — tunggu Boss drop file ke folder/INBOX.
- **P2** Ganti/hapus link Instagram & Facebook placeholder di footer.
- **P3** `git init` + commit awal repo Riani (belum ada version control).
- **P3** Custom domain (mis. rumahjahitriani.com) kalau Boss mau.

## Done (2026-07-12 — BREAK, branch feat/anti-cheat-missions)
- ✅ Spec + plan misi anti-curang (subagent-driven, 11/12 task; sisa deploy)
- ✅ Schema: ProofType, durationMinutes, startedAt, proofHash unique, IN_PROGRESS + migration
- ✅ Seed 11 misi (proofType/durasi; no-phone-15min baru; misi screenshot → TIMER)
- ✅ missionGuard (TDD 12 test) + start/cancel/complete server-authoritative + dedup SHA-256
- ✅ Web: MissionSession (countdown server-calibrated, fullscreen focus mode, pause), CameraCapture live-only, hapus ProofUploadModal
- ✅ 62 unit + 42 integration PASS, smoke test browser end-to-end + fix bug fullscreen hang

## Done (2026-07-05 malam — RIANI)
- ✅ Pindah `~/nanda-boutiq` → `79. WEBSITE RIANI/`; rebrand penuh → Rumah Jahit Riani
- ✅ 4 gambar KIE AI (hero/sulaman/lookbook/bespoke) gantikan link expired; pindah semua gambar ke `public/images/`
- ✅ Data asli: alamat Tukadmungga, WA klik-chat, jam WITA; hapus data dummy Jakarta
- ✅ Hapus grid produk RTW + cart + testimonial fiktif + tombol Lihat Koleksi (sesuai kondisi bisnis)
- ✅ Font logo Italiana; header sticky (fix logo kepotong); fix bg-ivory/95 transparan
- ✅ Audit redesign: smooth scroll, focus ring, meta/OG/favicon, copy banner
- ✅ Deploy Vercel LIVE + verifikasi (200, title, gambar, wa.me di bundle)
- ✅ Form Bespoke → WhatsApp Bu Riani (pesan terformat, dites end-to-end)
- ✅ KIE_API_KEY ~/.zshrc disamakan; memory JET `projects/rumah-jahit-riani.md`

## Done (2026-07-05 pagi — BREAK)
- ✅ Onboarding (gender + izin lokasi/notifikasi + telur pet)
- ✅ Streak ala Duolingo + lastBrokenStreak
- ✅ Pet egg system (stage, rarity roll, unlock fitur)
- ✅ Daily Report gaya Wrapped (`/me/report` + halaman)
- ✅ Event 2x EXP (model, endpoint, banner, multiplier EXP)
- ✅ Profile (ranking, badge, koleksi)
- ✅ Coins + Shop (8 item, streak recovery)
- ✅ Reset password (forgot/reset + email Resend/fallback log)
- ✅ Fix Prisma 7: dual adapter pg/Neon, dotenv, prisma.config datasource (integration test hidup lagi)
- ✅ Deploy production: 2 migration Neon, seed, api+web, alias break-id
