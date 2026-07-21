import { describe, it, expect } from 'vitest';
import { haversineM, measureTrack, GpsPoint } from './gpsTrack';

// 0.001° lintang ≈ 111.2 m
function walkNorth(count: number, stepDeg: number, dtMs: number, acc = 10): GpsPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: -6.2 + i * stepDeg,
    lng: 106.8,
    t: 1_700_000_000_000 + i * dtMs,
    acc,
  }));
}

describe('haversineM', () => {
  it('0.001 derajat lintang ≈ 111 meter', () => {
    const d = haversineM(-6.2, 106.8, -6.199, 106.8);
    expect(d).toBeGreaterThan(109);
    expect(d).toBeLessThan(113);
  });
});

describe('measureTrack', () => {
  it('mengukur jalan santai dengan benar', () => {
    // 10 titik, 111m per langkah, tiap 60 detik → ±1000m, ~1.85 m/s (jalan cepat)
    const r = measureTrack(walkNorth(10, 0.001, 60_000));
    expect(r.distanceM).toBeGreaterThan(990);
    expect(r.distanceM).toBeLessThan(1010);
    expect(r.durationSec).toBe(540);
    expect(r.validPoints).toBe(10);
  });

  it('membuang segmen teleport (kecepatan > 8 m/s)', () => {
    const pts = walkNorth(5, 0.001, 60_000);
    // Sisipkan lompatan 1.1 km dalam 1 detik di tengah
    pts.push({ lat: pts[4].lat + 0.01, lng: 106.8, t: pts[4].t + 1000, acc: 10 });
    const r = measureTrack(pts);
    expect(r.distanceM).toBeLessThan(500); // hanya 4 segmen jalan yang dihitung
  });

  it('membuang titik akurasi buruk', () => {
    const pts = walkNorth(10, 0.001, 60_000, 500); // akurasi 500m semua
    expect(measureTrack(pts).distanceM).toBe(0);
  });

  it('membuang waktu mundur', () => {
    const pts = walkNorth(3, 0.001, 60_000);
    pts[2] = { ...pts[2], t: pts[0].t - 1000 };
    const r = measureTrack(pts);
    expect(r.distanceM).toBeGreaterThan(109);
    expect(r.distanceM).toBeLessThan(113);
  });

  it('track kosong aman', () => {
    expect(measureTrack([])).toEqual({ distanceM: 0, durationSec: 0, validPoints: 0 });
  });
});
