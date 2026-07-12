# Known Issues — BREAK APP

## Open
- **Fullscreen API tidak didukung iOS Safari** — Focus Mode di iPhone jalan tanpa fullscreen; pause tetap aktif via `visibilitychange`. By design (fallback), bukan bug. (2026-07-12)
- **Kamera live (`getUserMedia`) butuh HTTPS atau localhost** — di prod aman (Vercel HTTPS); jangan tes via IP LAN tanpa TLS. Desktop tanpa kamera dapat fallback "buka di HP". (2026-07-12)
- **Integration test tidak mem-wipe tabel `Mission`** — pool misi nyata (hasil `db:seed`) ikut kebaca test yang assign misi acak; sudah bikin flaky sekali (difix dengan fixture deterministik di missions.integration.test.ts). Idealnya test DB terpisah. (2026-07-12)
- **Batas anti-curang yang diterima (by design, tanpa AI)**: user bisa start misi lalu tidak fokus di device lain (wall-clock tetap jalan); upload non-kamera bisa dipaksa via curl (dedup + timer tetap berlaku). Tercatat di spec. (2026-07-12)
- **Email reset password tidak terkirim di production** — `RESEND_API_KEY` belum diset di Vercel project `api`. Dampak: user prod yang klik "Lupa password?" tidak menerima email; link hanya tercatat di Vercel function logs. Fix: tambah env key + redeploy. (2026-07-05)
- **`pnpm test:integration` menghapus seluruh data user di DB lokal `break_db`** — setup test (`src/test/setup.ts`) melakukan deleteMany semua tabel user di DATABASE_URL yang sama dengan dev. Aman untuk dev, tapi jangan simpan data penting; idealnya pakai TEST_DATABASE_URL terpisah. (2026-07-05)
- **Alias `break-id.vercel.app` tidak otomatis pindah** saat deploy web baru — wajib `vercel alias set <deploy-url> break-id.vercel.app` manual setelah tiap `vercel --prod`. (2026-07-05)
- **Warning Vite dev**: `Failed to resolve dependency: @break/shared` di optimizeDeps — sisa workspace dep yang sudah dihapus; tidak memengaruhi build/prod, bisa dibersihkan dari `vite.config.ts`. (pre-existing)

## Resolved
- ~~Integration test & seed rusak sejak migrasi Prisma 7/Neon (adapter Neon WebSocket-only ke localhost)~~ — fixed commit `544a674` (dual adapter pg/Neon + dotenv + prisma.config datasource). (2026-07-05)

## RIANI (79. WEBSITE RIANI/nanda-boutiq)
- **Repo belum git** — tidak ada history/rollback. Fix: `git init` + commit awal. (2026-07-05)
- **Tailwind v4 opacity modifier warna custom render transparan** (`bg-ivory/95` → `oklab(0 0 0 / 0)`). Workaround: warna solid. Belum diinvestigasi akar masalahnya (kemungkinan versi Tailwind 4.1.14 + @theme). (2026-07-05)
- **Link Instagram/Facebook footer masih placeholder** (instagram.com / facebook.com). (2026-07-05)
