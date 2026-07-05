# Tasks — BREAK APP

## Active
- **P1** Set `RESEND_API_KEY` di Vercel project `api` (production) + redeploy — email reset password belum terkirim ke user (link hanya di function logs). Butuh akun resend.com (gratis 3.000 email/bln).
- **P2** Admin endpoint/panel untuk membuat Event baru (sekarang hanya via SQL Neon; event seed berakhir 12 Jul 2026).
- **P2** UI perayaan pet menetas / naik stage (sekarang perubahan hanya terlihat setelah refresh).
- **P3** Render emote/outfit/cosmetic yang dibeli pada tampilan pet.
- **P3** Streak bonus +50 per 7 hari (spec CLAUDE.md §5.3) — konfirmasi dulu masih diinginkan atau tidak.
- **P3** Phase 2 backlog lama: Fast Click + Pattern Match games, fullscreen blocker level 3, Telegram fallback notifier, analytics dashboard, admin verification.

## Done (2026-07-05)
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
