# Decision Log — BREAK APP

## 2026-07-05 — Paket gamification + reset password (sesi JET, request Tristan)
- **Multiplier event hanya untuk EXP, bukan poin** — menjaga fairness leaderboard; event mempercepat progres pet/level tanpa merusak ranking.
- **Satu endpoint agregat `GET /me/report`** dipakai halaman Profile, Report, dan Shop — lebih sedikit endpoint & fetch.
- **Streak recovery** = item shop consumable (100 coins). Saat streak putus, nilai lama disimpan di `User.lastBrokenStreak`; recovery menjumlahkan streak lama + berjalan.
- **Rarity telur di-roll saat menetas** dengan bobot linear dari EXP user (bukan tabel gacha di DB) — kurva mudah diganti nanti di `progression.ts`.
- **Katalog shop hardcoded** di `lib/shopItems.ts` (bukan tabel DB) — item masih statis, hindari CRUD prematur.
- **Badge/achievement dihitung client-side** dari data report — belum perlu tabel achievement.
- **Adapter Prisma dipilih dari connection string** (`neon.tech` → PrismaNeon, lainnya → PrismaPg) — satu codebase jalan di lokal & Vercel tanpa env flag tambahan.
- **Reset password**: token 32-byte disimpan sebagai SHA-256 hash, TTL 1 jam, sekali pakai, semua refresh token dicabut saat reset, respons forgot selalu generik (anti user-enumeration). Email via Resend REST API polos (tanpa SDK/dependency); tanpa API key → log console (dev-friendly, prod perlu key).
- **Deploy Vercel manual** `vercel --prod` per app + `vercel alias set ... break-id.vercel.app` — alias tidak berpindah otomatis ke deployment baru.
