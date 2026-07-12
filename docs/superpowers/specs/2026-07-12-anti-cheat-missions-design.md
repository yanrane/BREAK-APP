# Spec: Misi Anti-Curang (Server Timer + Kamera Live + Focus Mode)

- Tanggal: 2026-07-12
- Requester: Tristan
- Status: approved (desain disetujui via chat)
- Konteks: bagian pertama dari konsep "AI Companion" — diputuskan **tanpa AI tambahan**; anti-curang berbasis aturan yang ditegakkan server.

## Tujuan

Memastikan misi harian benar-benar dikerjakan, bukan sekadar menekan "Done":

1. Misi berbasis waktu tidak bisa diselesaikan lebih cepat dari durasinya (jam server yang menentukan).
2. Bukti foto wajib dijepret live dari kamera dalam app — bukan upload dari galeri.
3. Foto yang sama tidak bisa dipakai dua kali (dedup global lintas user).
4. Focus Mode: misi ber-timer berjalan fullscreen; keluar fullscreen/pindah tab = pause + pilihan Lanjutkan / Batalkan.

## Non-goals (dicatat di backlog, bukan siklus ini)

- Verifikasi AI (vision/LLM) — ditolak eksplisit oleh requester.
- Integrasi Strava.
- Heartbeat sessions (mahal di serverless, kompleks).
- Daily Reflection, Brain Training Games, animasi/UX polish, Anti-Exit penuh (banner app-wide) — sub-proyek terpisah.

## Data model (Prisma)

- `enum ProofType { PHOTO TIMER PHOTO_AND_TIMER }`
- `Mission` tambah:
  - `proofType ProofType @default(PHOTO)`
  - `durationMinutes Int?` — wajib terisi untuk `TIMER` / `PHOTO_AND_TIMER` (divalidasi di seed/service, bukan constraint DB).
- `UserMission` tambah:
  - `startedAt DateTime?`
  - `proofHash String? @unique` — SHA-256 file foto; unique global (Postgres mengizinkan banyak NULL).
- `MissionStatus` tambah `IN_PROGRESS` (flow: `ASSIGNED → IN_PROGRESS → COMPLETED → VERIFIED/REJECTED`).
- Seed: mapping proofType + durasi per misi existing (jogging-15min → PHOTO_AND_TIMER/15, read-20pages → PHOTO_AND_TIMER/20, meditation-10min → TIMER/10, dst.) + misi baru `no-phone-15min` (TIMER/15, MENTAL, requiresProof=false).

## API (prefix `/api/v1`)

| Method | Path | Perilaku |
|---|---|---|
| POST | `/missions/:userMissionId/start` | Set `startedAt = now()` server, status `IN_PROGRESS`. Idempoten: kalau sudah IN_PROGRESS, kembalikan sesi berjalan (resume). Error kalau status bukan ASSIGNED/IN_PROGRESS. |
| POST | `/missions/:userMissionId/cancel` | Kembalikan ke `ASSIGNED`, hapus `startedAt`. Hanya dari IN_PROGRESS. |
| POST | `/missions/:userMissionId/complete` | Validasi baru berlapis (lihat di bawah), selebihnya flow lama (auto-verify + rewards). |

Validasi `complete` (urutan):
1. Status harus `IN_PROGRESS` → kalau belum start: `400 MISSION_NOT_STARTED`.
2. Jika ber-timer: `now - startedAt >= durationMinutes` → kalau kurang: `400 TIMER_NOT_ELAPSED`, payload menyertakan `remainingSeconds`.
3. Jika ber-foto: file wajib ada (multipart, validasi MIME + magic bytes existing tetap berlaku); hitung SHA-256; kalau hash sudah ada di `UserMission` mana pun: `400 PROOF_DUPLICATE`. Simpan hash bersama proofUrl.

Semua timestamp dari jam server. Tidak ada input waktu dari client yang dipercaya.

## Frontend (apps/web)

- Kartu misi hari ini: tombol **Start Mission** (menggantikan langsung-upload untuk semua misi).
- Halaman sesi aktif (`/missions/:id/active`):
  - Countdown dihitung dari `startedAt` server + offset (server mengembalikan `now` untuk kalibrasi; jam device tidak dipakai mentah).
  - Misi ber-timer: request fullscreen saat mulai. Event `fullscreenchange` / `visibilitychange` → overlay pause dengan tombol **Lanjutkan** (re-request fullscreen) dan **Batalkan misi** (panggil cancel).
  - `beforeunload` guard aktif selama sesi berjalan (Anti-Exit versi ringan).
  - Setelah timer habis (atau untuk misi PHOTO murni, langsung): panel kamera.
- Panel kamera: `getUserMedia({ video })` → preview → jepret ke canvas → blob JPEG → upload ke `complete`. **Tidak ada input file dari galeri.** Kalau `getUserMedia` gagal/tidak ada kamera: pesan "Misi ini butuh kamera — buka BREAK di HP kamu."
- Error `TIMER_NOT_ELAPSED` (mis. user utak-atik): tampilkan sisa waktu, kembali ke countdown.

## Known limitations (diterima, dicatat)

1. User bisa start misi lalu tidak fokus (scrolling di device lain) — wall-clock tetap jalan dan server akan meloloskan. Menutup ini butuh heartbeat/AI yang sudah ditolak. Fullscreen + pause menutup kecurangan kasual.
2. "Kamera live" ditegakkan di client; secara teknis file arbitrer bisa di-POST via curl. Dedup hash + timer tetap berlaku sebagai lapisan kedua.
3. Pause client tidak menambah waktu minimum di server (pause = UX untuk user jujur, bukan enforcement).

## Testing

- Unit (Vitest): logika validasi timer & status transition sebagai pure function (pola `apps/api/src/lib/progression.ts`), hashing dedup.
- Integration (Supertest): start → complete terlalu cepat (400) → complete setelah durasi (200, pakai mock waktu/durasi 0 di test) → submit foto duplikat (400) → cancel → start ulang.
  - ⚠️ ingat: `pnpm test:integration` menghapus data DB lokal.
- Manual di HP (dev/prod): kamera live, fullscreen enter/exit, pause/resume, beforeunload.

## Rollout

1. Migration + seed update (lokal dulu, lalu Neon via `migrate deploy`).
2. Deploy api → web → `vercel alias set … break-id.vercel.app` (alias manual, known issue).
3. UserMission lama yang masih ASSIGNED tetap valid — misi tanpa `startedAt` tinggal mengikuti flow baru (harus start dulu).
