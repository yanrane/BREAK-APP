# Decision Log — BREAK APP

## 2026-07-12 — Misi anti-curang (sesi JET, request Tristan "AI Companion")
- **TANPA AI** — keputusan eksplisit Tristan saat klarifikasi: anti-curang berbasis aturan, bukan model vision berbayar. Konsep "AI Companion" didekomposisi jadi 5 sub-proyek; ini yang pertama.
- **Server-authoritative timestamps, bukan heartbeat** — validasi murni dari `startedAt`/`now` jam server; heartbeat ditolak (biaya serverless + kompleksitas). Konsekuensi yang diterima: user bisa tidak fokus di device lain selama wall-clock berjalan.
- **Bukti foto wajib kamera live in-app** (getUserMedia, tanpa file picker) — foto galeri/lama tidak bisa dipakai. Konsekuensi: misi foto praktis khusus HP; desktop dapat fallback pesan. Enforcement client-side; lapisan kedua = dedup hash + timer.
- **Dedup foto = SHA-256 + unique constraint DB** (bukan find-then-insert) — race-proof, P2002 → PROOF_DUPLICATE.
- **Misi berbukti screenshot dikonversi TIMER murni** (call-family, meditation, stretch, learn-something) — screenshot mustahil dijepret kamera live, timer adalah pengganti yang konsisten.
- **Pause focus mode = UX untuk user jujur, bukan enforcement** — pause client tidak menambah syarat waktu server (wall-clock tetap acuan); menutupnya butuh heartbeat yang sudah ditolak.
- **`requestFullscreen` tidak pernah di-await** — promise-nya bisa menggantung menunggu izin dan menahan transisi UI (bug nyata ditemukan saat smoke test).
- **File proof dihapus (blob/disk) saat complete ditolak** — PROOF_DUPLICATE/TIMER_NOT_ELAPSED adalah jalur normal; tanpa cleanup, storage prod tumbuh tak terbatas (temuan final review).

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

## 2026-07-05 (malam) — Website Rumah Jahit Riani (sesi JET, detour dari BREAK)
- **Katalog RTW + cart + testimonial DIHAPUS, bukan disembunyikan** — bisnis nyata hanya 1 jenis kebaya & belum ada pelanggan review; website tidak boleh mengandung rekayasa (request eksplisit Boss). Kode lama bisa dikembalikan nanti (catatan: repo belum git, jadi acuan = handoff ini).
- **Order flow = form Bespoke → wa.me Bu Riani** dengan pesan terformat (bukan backend/email) — usaha kecil, WhatsApp adalah kanal order sesungguhnya; nol infrastruktur tambahan.
- **Gambar via KIE AI nano-banana-pro, disimpan lokal `public/images/`** — link gambar AI Studio expired; aset lokal tidak bisa expired. Path `/src/assets/` dilarang (blank di produksi Vite).
- **Header `sticky` bukan `fixed`** — fixed mulai dari y=0 sehingga logo ketutup announcement banner.
- **Hindari opacity modifier warna custom Tailwind v4 di project ini** (`bg-ivory/95` → transparan); pakai warna solid.
- **Font brand terpisah (`--font-brand` Italiana)** dari font body — logo dapat karakter fashion-house tanpa menyentuh tipografi konten.
