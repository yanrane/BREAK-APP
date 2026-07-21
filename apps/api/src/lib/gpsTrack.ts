/**
 * Validasi & pengukuran track GPS misi outdoor. Jarak SELALU dihitung ulang
 * di server dari titik mentah — total dari client tidak pernah dipercaya.
 *
 * ponytail: menangkal manipulasi sederhana (skor palsu, teleport, kendaraan);
 * track sintetis yang meniru kecepatan jogging realistis tetap lolos —
 * upgrade berikutnya kalau perlu: cek variansi kecepatan + jitter accuracy.
 */

export interface GpsPoint {
  lat: number;
  lng: number;
  /** epoch ms saat titik direkam */
  t: number;
  /** akurasi meter dari Geolocation API (opsional) */
  acc?: number;
}

/** Titik dengan akurasi lebih buruk dari ini diabaikan (indoor/sinyal jelek). */
export const MAX_ACCURACY_M = 50;
/** Kecepatan segmen di atas ini (m/s) = bukan lari manusia → segmen dibuang. */
export const MAX_SEGMENT_SPEED = 8;
/** Kecepatan rata-rata maksimum yang masuk akal untuk seluruh sesi (m/s). */
export const MAX_AVG_SPEED = 6;

/** Jarak haversine antar dua koordinat dalam meter. */
export function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface TrackResult {
  /** Jarak valid total (meter), setelah filter akurasi & kecepatan. */
  distanceM: number;
  /** Durasi dari titik valid pertama sampai terakhir (detik). */
  durationSec: number;
  /** Jumlah titik yang lolos filter. */
  validPoints: number;
}

/**
 * Hitung jarak track dengan filter:
 * - titik akurasi > MAX_ACCURACY_M dibuang
 * - urutan waktu harus maju (dt <= 0 dibuang)
 * - segmen berkecepatan > MAX_SEGMENT_SPEED dibuang (teleport/kendaraan/spoof)
 */
export function measureTrack(points: GpsPoint[]): TrackResult {
  const clean = points.filter(
    (p) =>
      Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.t) &&
      Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 &&
      (p.acc === undefined || p.acc <= MAX_ACCURACY_M),
  );

  let distanceM = 0;
  let validPoints = clean.length > 0 ? 1 : 0;
  let prev: GpsPoint | null = clean[0] ?? null;
  let firstT: number | null = prev?.t ?? null;
  let lastT: number | null = prev?.t ?? null;

  for (let i = 1; i < clean.length; i++) {
    const cur = clean[i];
    if (!prev) { prev = cur; continue; }
    const dtSec = (cur.t - prev.t) / 1000;
    if (dtSec <= 0) continue; // waktu mundur/duplikat
    const segM = haversineM(prev.lat, prev.lng, cur.lat, cur.lng);
    if (segM / dtSec > MAX_SEGMENT_SPEED) {
      // Teleport/spoof — buang segmen tapi lanjut dari titik baru
      prev = cur;
      continue;
    }
    distanceM += segM;
    validPoints++;
    lastT = cur.t;
    prev = cur;
  }

  return {
    distanceM: Math.round(distanceM),
    durationSec: firstT !== null && lastT !== null ? Math.round((lastT - firstT) / 1000) : 0,
    validPoints,
  };
}
