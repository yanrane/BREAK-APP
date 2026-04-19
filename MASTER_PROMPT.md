# Master Prompt — Kickoff BREAK di Claude Code

> Pakai prompt ini sebagai **pesan pertama** di sesi Claude Code setelah `CLAUDE.md` diletakkan di root project.

---

## Prompt 1 — Initialization & Scaffolding

```
Baca CLAUDE.md secara menyeluruh sebelum melakukan apapun.

Tugas pertamamu adalah melakukan scaffolding proyek BREAK sesuai spesifikasi di CLAUDE.md. Konkretnya:

1. Inisialisasi monorepo pnpm dengan struktur yang tercantum di Section 3 (apps/web, apps/api, apps/extension, packages/shared).
2. Setup apps/api dengan Express + TypeScript + Prisma, termasuk:
   - Skema Prisma persis seperti Section 4 (jangan tambah atau kurangi field tanpa tanya saya dulu).
   - Koneksi ke PostgreSQL lokal via DATABASE_URL di .env.
   - Middleware dasar: helmet, cors, express-rate-limit, error handler global.
   - Route kosong untuk semua endpoint di Section 6, return stub 501 Not Implemented.
3. Setup apps/web dengan Vite + React 18 + TypeScript + Tailwind + shadcn/ui, termasuk:
   - Routing dasar: /, /login, /register, /dashboard, /missions, /leaderboard, /games
   - Layout shell dengan navbar dan dark mode toggle
4. Setup apps/extension dengan Manifest V3 dasar — belum perlu logic tracking, cukup struktur folder + manifest valid.
5. Generate .env.example sesuai Section 9.
6. Buat README.md ringkas di root yang poin-poinnya: overview, setup dev, struktur folder.

Aturan kerja:
- Ikuti coding conventions di Section 8 dengan ketat.
- Jangan install dependency yang tidak disebutkan di CLAUDE.md tanpa justifikasi.
- Setelah selesai, tunjukkan ringkasan struktur folder akhir + daftar command untuk menjalankan dev server.
- JANGAN implementasi business logic apapun di tahap ini. Scaffolding only.

Setelah scaffolding selesai dan saya konfirmasi, kita lanjut ke implementasi auth di Prompt 2.
```

---

## Prompt 2 — Auth Implementation

```
Sekarang implementasikan sistem autentikasi lengkap di apps/api.

Requirement:
1. Endpoint:
   - POST /api/v1/auth/register — body: { email, username, password }. Password di-hash dengan bcrypt (cost 12).
   - POST /api/v1/auth/login — body: { email, password }. Return { accessToken, refreshToken, user }.
   - POST /api/v1/auth/refresh — body: { refreshToken }. Return accessToken baru.
   - GET /api/v1/me — butuh access token. Return user profile minus passwordHash.

2. Validasi dengan Zod schema di packages/shared, import di backend dan frontend.

3. JWT:
   - Access token expiry 15 menit, refresh token 7 hari.
   - Refresh token disimpan di DB (tambah table RefreshToken) untuk bisa di-revoke.
   - Middleware requireAuth yang parse Authorization: Bearer <token>.

4. Rate limit: login max 5 request per IP per menit.

5. Error handling: kembalikan error code konsisten sesuai format di Section 6 (INVALID_CREDENTIALS, USER_EXISTS, dll).

6. Frontend apps/web:
   - Halaman /login dan /register dengan React Hook Form + Zod.
   - Zustand store untuk auth state (accessToken, user).
   - Axios interceptor yang auto-attach token + auto-refresh kalau 401.
   - Redirect ke /dashboard setelah login sukses.

7. Test:
   - Unit test untuk password hashing + JWT utility.
   - Integration test untuk 3 endpoint auth (pakai supertest + test DB).

Tunjukkan semua file yang dibuat/diubah + hasil run test di akhir.
```

---

## Prompt 3 — Daily Missions Feature

```
Implementasikan fitur Daily Missions end-to-end.

Backend:
1. Seed script di apps/api/prisma/seed.ts — isi Mission table dengan minimal 10 misi sesuai contoh di Section 5.2 CLAUDE.md.
2. Cron job di apps/api/src/jobs/assignDailyMissions.ts:
   - Jalan tiap hari jam 00:00 WIB (Asia/Jakarta).
   - Untuk setiap user aktif, pilih 3 misi random dengan rule: minimal 1 PHYSICAL, 1 MENTAL, 1 SOCIAL/CREATIVE.
   - Skip misi yang masih dalam cooldown untuk user tersebut.
   - Insert ke UserMission dengan status ASSIGNED.
3. Endpoint:
   - GET /api/v1/missions/today — return 3 misi user hari ini (atau empty array kalau belum di-assign).
   - POST /api/v1/missions/:userMissionId/complete — multipart/form-data dengan field 'proof' (file).
     - Validasi file: JPG/PNG/WEBP, max 5MB, cek magic bytes pakai package 'file-type'.
     - Rename file ke <uuid>.<ext>, simpan ke UPLOAD_DIR.
     - Update status ke COMPLETED lalu auto-verify jadi VERIFIED (Phase 1 behavior).
     - Tambah points ke User.totalPoints.
     - Return updated mission object.
   - GET /api/v1/missions/history?page=1&limit=20 — paginated history.

Frontend:
4. Halaman /missions:
   - Tampilkan 3 card misi hari ini dengan icon kategori, deskripsi, points reward.
   - Button "Selesaikan" yang buka modal upload foto (preview sebelum submit).
   - Loading state + optimistic UI update setelah submit sukses.
   - Kalau sudah VERIFIED, tampilkan badge centang + thumbnail bukti.
5. Halaman /missions/history: list paginated dengan filter status.

Test:
- Unit test logic pemilihan misi random dengan rule kategori.
- Integration test flow complete: assign → complete → verify → points bertambah.

Jangan implementasikan moderation panel — itu Phase 2.
```

---

## Prompt 4 — Chrome Extension (AI Agent)

```
Implementasikan Chrome Extension BREAK di apps/extension sebagai AI Agent untuk monitoring + nudging.

Persyaratan manifest.json (Manifest V3):
- Permissions: "tabs", "storage", "notifications", "alarms", "activeTab"
- Host permissions: <all_urls> (untuk detect domain)
- Background service worker: background.js

Logic di background.ts:
1. Pada startup, ambil user settings dari backend (GET /api/v1/me/settings) pakai API token yang disimpan di chrome.storage.local.
2. Listen chrome.tabs.onActivated dan chrome.tabs.onUpdated.
3. Untuk tab yang domainnya ada di trackedDomains, mulai timer.
4. Setiap 60 detik, flush durasi aktif ke backend via POST /api/v1/usage-logs sebagai batch.
5. Hitung total hari ini dari local storage (reset tiap 00:00 WIB). Kalau > dailyLimitMinutes:
   - Trigger notifikasi chrome.notifications.create dengan CTA "Buka BREAK".
   - Level 1 pada limit tercapai, level 2 pada +30 menit, level 3 pada +60 menit.
   - Level 3 INJECT content script ke tab aktif yang menampilkan fullscreen overlay merah dengan pesan + tombol "Saya paham" yang harus diklik untuk dismiss.

Popup UI (apps/extension/src/popup):
- Tampilkan: usage hari ini (menit), sisa quota, link ke website BREAK, toggle "Pause tracking 1 jam".

Options page (apps/extension/src/options):
- Form untuk input API token (login flow: redirect ke web BREAK, user copy token dari settings, paste ke sini).
- Edit dailyLimitMinutes dan trackedDomains (multi-input).

Backend tambahan:
- Endpoint POST /api/v1/usage-logs dengan body [{ domain, seconds, loggedAt }].
- Endpoint GET /api/v1/usage-logs/summary?date=YYYY-MM-DD.
- Tambah API token khusus untuk extension (jangan pakai JWT user biasa) — generate di endpoint POST /api/v1/me/extension-token.

Test manual: dokumentasi langkah uji di docs/extension-test-plan.md.
```

---

## Prompt 5 — Mini Games + Leaderboard

```
Implementasikan Mini Games dan Leaderboard.

Mini Games (apps/web/src/features/games):
1. Reaction Time:
   - State machine: idle → waiting → go → clicked → result.
   - Random delay 2-6 detik sebelum trigger.
   - 5 round, simpan array reactionTimes, ambil average.
   - Score = max(0, 1000 - avgMs).

2. Fast Clicking (CPS):
   - Countdown 3-2-1, lalu 10 detik timer.
   - Count clicks pada tombol besar di tengah layar.
   - Score = total clicks.

3. Pattern Match:
   - Grid 4x4, tampilkan sequence warna 3 kotak di awal.
   - Setiap level tambah 1 kotak ke sequence.
   - User klik sesuai urutan, salah = game over.
   - Score = level tertinggi dicapai.

Di akhir tiap sesi, POST /api/v1/games/submit dengan { gameType, score }.

Backend anti-cheat sederhana:
- Reject score di luar range reasonable (mis. reaction < 100ms atau clicks > 20 CPS).
- Rate limit: max 10 submit per game per user per hari.
- Points dari game: linear mapping skor → 1-5 poin, capped 20 poin/hari total dari game.

Leaderboard:
4. Endpoint GET /api/v1/leaderboard?period=weekly|monthly|alltime.
   - Weekly: sum points dari UserMission.pointsEarned yang verifiedAt dalam 7 hari terakhir + poin game periode yang sama.
   - Monthly: 30 hari terakhir.
   - Alltime: User.totalPoints.
   - Return top 50 dengan { rank, username, avatarUrl, points }.
   - Exclude user yang settings.showOnLeaderboard = false.

5. Frontend /leaderboard:
   - Tab toggle period.
   - Highlight row user sendiri dengan background accent.
   - Show rank user sendiri di bawah kalau tidak masuk top 50.

Tambahkan settings toggle showOnLeaderboard di halaman profile.
```

---

## Prompt 6 — Polish & Deploy

```
Fase finishing sebelum deploy ke Mac Mini:

1. Landing page (/) di apps/web:
   - Hero section: "BREAK — Keluar dari Brain Rot, Kembali ke Dunia Nyata"
   - Section edukasi dengan 4 poin dampak brain rot (pakai content di Section 14 CLAUDE.md, sitasi source).
   - Demo video misi + screenshot extension.
   - CTA: Register + Install Extension.

2. Analytics dashboard di /dashboard:
   - Chart line: screen time harian 7 hari terakhir (Recharts).
   - Card: streak saat ini, total points, rank leaderboard saat ini.
   - List: 3 misi hari ini (summary).

3. Error handling & UX polish:
   - Semua halaman punya loading skeleton + empty state + error state.
   - Toast notification pakai sonner atau shadcn toast untuk feedback action.

4. Production setup:
   - ecosystem.config.js untuk PM2 (api + cron dalam 1 app dengan instances: 1, atau pisah).
   - Nginx config contoh di docs/deployment.md.
   - Script migrate:prod untuk Prisma migrate deploy.
   - Enable HTTPS via Let's Encrypt (dokumentasikan langkahnya).

5. Final QA checklist:
   - [ ] Semua endpoint return format response standar.
   - [ ] Tidak ada secret ter-commit.
   - [ ] pnpm typecheck PASS di semua apps.
   - [ ] pnpm test PASS.
   - [ ] Extension berjalan di Chrome versi stabil terbaru.
   - [ ] Mobile responsive untuk web (mobile breakpoint ≥ 375px).

Deliverable akhir: changelog v1.0 + instruksi deployment step-by-step.
```

---

## Tips Penggunaan

1. **Jalankan prompt secara sekuensial** — jangan skip. Tiap prompt mengandaikan tahap sebelumnya sudah selesai.
2. **Setelah tiap prompt**, review output Claude Code, test manual, lalu baru lanjut prompt berikutnya.
3. **Kalau ada deviation dari CLAUDE.md**, Claude Code akan tanya — jawab konsisten supaya konvensi tetap terjaga.
4. **Commit setelah tiap prompt selesai**. Convention: `feat(scope): summary` sesuai Section 8 CLAUDE.md.
5. **Untuk modifikasi minor**, gunakan prompt ad-hoc tanpa harus ikut urutan di atas — cukup sebut file/fitur yang mau diubah.

---

*Master prompt ini di-tune untuk Claude Code. Untuk Cursor/Windsurf, prompt masih berlaku tapi mungkin perlu sedikit adjustment pada bahasa directive-nya.*
