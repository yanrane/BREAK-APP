# Known Issues — BREAK APP

## Open
- **Email reset password tidak terkirim di production** — `RESEND_API_KEY` belum diset di Vercel project `api`. Dampak: user prod yang klik "Lupa password?" tidak menerima email; link hanya tercatat di Vercel function logs. Fix: tambah env key + redeploy. (2026-07-05)
- **`pnpm test:integration` menghapus seluruh data user di DB lokal `break_db`** — setup test (`src/test/setup.ts`) melakukan deleteMany semua tabel user di DATABASE_URL yang sama dengan dev. Aman untuk dev, tapi jangan simpan data penting; idealnya pakai TEST_DATABASE_URL terpisah. (2026-07-05)
- **Alias `break-id.vercel.app` tidak otomatis pindah** saat deploy web baru — wajib `vercel alias set <deploy-url> break-id.vercel.app` manual setelah tiap `vercel --prod`. (2026-07-05)
- **Warning Vite dev**: `Failed to resolve dependency: @break/shared` di optimizeDeps — sisa workspace dep yang sudah dihapus; tidak memengaruhi build/prod, bisa dibersihkan dari `vite.config.ts`. (pre-existing)

## Resolved
- ~~Integration test & seed rusak sejak migrasi Prisma 7/Neon (adapter Neon WebSocket-only ke localhost)~~ — fixed commit `544a674` (dual adapter pg/Neon + dotenv + prisma.config datasource). (2026-07-05)
