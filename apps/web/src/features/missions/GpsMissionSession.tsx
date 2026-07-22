import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import Confetti from '../../components/Confetti';
import type { GpsPoint, Mission, UserMission } from './useMissions';

// Mirror filter server (apps/api/src/lib/gpsTrack.ts) supaya angka di layar
// cocok dengan hasil validasi server
const MAX_ACCURACY_M = 50;
const MAX_SEGMENT_SPEED = 8;
const MIN_POINT_INTERVAL_MS = 2500;

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatKm(m: number): string {
  return (m / 1000).toFixed(2);
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type GpsStatus = 'idle' | 'requesting' | 'searching' | 'active' | 'denied' | 'unavailable';

interface GpsMissionSessionProps {
  userMission: UserMission;
  mission: Mission;
  startMission: (id: string) => Promise<unknown>;
  cancelMission: (id: string) => Promise<unknown>;
  completeGpsMission: (id: string, points: GpsPoint[]) => Promise<UserMission>;
}

export default function GpsMissionSession({
  userMission,
  mission,
  startMission,
  cancelMission,
  completeGpsMission,
}: GpsMissionSessionProps) {
  const navigate = useNavigate();
  const targetM = mission.distanceMeters ?? 1000;

  const [tracking, setTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [distanceM, setDistanceM] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [done, setDone] = useState<UserMission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pointsRef = useRef<GpsPoint[]>([]);
  const lastKeptRef = useRef<GpsPoint | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFixAtRef = useRef(0);
  const startedAtRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  // Jam berjalan + deteksi sinyal hilang (fix terakhir > 10 detik lalu)
  useEffect(() => {
    if (!tracking) return;
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      if (lastFixAtRef.current && Date.now() - lastFixAtRef.current > 10_000) {
        setGpsStatus((s) => (s === 'active' ? 'searching' : s));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [tracking]);

  // Bersihkan watch + wake lock saat unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  const onPosition = (pos: GeolocationPosition) => {
    lastFixAtRef.current = Date.now();
    setGpsStatus('active');

    const { latitude, longitude, accuracy } = pos.coords;
    if (accuracy > MAX_ACCURACY_M) return; // sinyal jelek — tampilkan status saja

    const point: GpsPoint = { lat: latitude, lng: longitude, t: pos.timestamp, acc: Math.round(accuracy) };
    const last = lastKeptRef.current;
    if (last) {
      if (point.t - last.t < MIN_POINT_INTERVAL_MS) return; // throttle
      const dtSec = (point.t - last.t) / 1000;
      const segM = haversineM(last.lat, last.lng, point.lat, point.lng);
      if (dtSec > 0 && segM / dtSec <= MAX_SEGMENT_SPEED) {
        setDistanceM((d) => d + segM);
      }
    }
    lastKeptRef.current = point;
    pointsRef.current.push(point);
    if (pointsRef.current.length > 1500) pointsRef.current.shift(); // jaga limit server
  };

  const handleStart = async () => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }
    try {
      setSubmitError(null);
      setGpsStatus('requesting');
      await startMission(userMission.id); // startedAt jam server + cek jendela jam
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
        ?.response?.data?.error;
      setGpsStatus('idle');
      setSubmitError(
        apiErr?.code?.startsWith('MISSION_START') && apiErr.message
          ? apiErr.message
          : 'Gagal memulai misi. Coba lagi.',
      );
      return;
    }

    startedAtRef.current = Date.now();
    pointsRef.current = [];
    lastKeptRef.current = null;
    setDistanceM(0);
    setElapsedSec(0);
    setTracking(true);
    setGpsStatus('searching');

    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition,
      (err) => setGpsStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'searching'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );

    // Layar tetap nyala selama sesi (didukung Chrome/Android; gagal = tak apa)
    (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } })
      .wakeLock?.request('screen')
      .then((lock) => { wakeLockRef.current = lock; })
      .catch(() => {});
  };

  const handleSubmit = async () => {
    if (isSubmitting || done) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const updated = await completeGpsMission(userMission.id, pointsRef.current);
      setDone(updated);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      wakeLockRef.current?.release().catch(() => {});
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
        ?.response?.data?.error;
      setSubmitError(apiErr?.message ?? 'Gagal menyimpan hasil. Coba lagi.');
      autoSubmittedRef.current = false; // izinkan auto-submit ulang setelah error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Target tercapai → submit otomatis sekali
  const reached = distanceM >= targetM;
  useEffect(() => {
    if (reached && tracking && !done && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reached, tracking, done]);

  const handleCancel = async () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    wakeLockRef.current?.release().catch(() => {});
    try { await cancelMission(userMission.id); } catch { /* status mungkin sudah berubah */ }
    navigate('/missions');
  };

  const progressPct = Math.min(100, (distanceM / targetM) * 100);
  const avgKmh = elapsedSec > 0 ? (distanceM / elapsedSec) * 3.6 : 0;

  if (done) {
    return (
      <div className="border-2 border-ink p-8 shadow-hard text-center bg-lime space-y-3">
        <Confetti />
        <p className="text-4xl">🏁</p>
        <p className="font-extrabold text-xl">Target tercapai!</p>
        <p className="font-extrabold text-3xl">{formatKm(done.gpsDistanceM ?? distanceM)} km</p>
        <p className="text-sm font-semibold">
          {formatClock(elapsedSec)} · +{done.pointsEarned} poin masuk
        </p>
        <button
          onClick={() => navigate('/missions')}
          className="px-6 py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm"
        >
          ← Kembali ke Misi Harian
        </button>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="text-center space-y-4">
        <p className="text-6xl">📍</p>
        <p className="text-3xl font-extrabold">{formatKm(targetM)} km</p>
        <p className="text-sm text-muted font-semibold max-w-sm mx-auto">
          Izinkan akses lokasi, lalu bergeraklah di luar ruangan. Biarkan halaman ini
          tetap terbuka — jarak dihitung dari GPS dan divalidasi server.
        </p>
        {gpsStatus === 'unavailable' && (
          <p className="text-coral text-sm font-bold">Perangkat ini tidak mendukung GPS.</p>
        )}
        <button
          onClick={handleStart}
          disabled={gpsStatus === 'requesting'}
          className="w-full py-4 text-lg font-extrabold border-2 border-ink bg-ink text-cream shadow-hard disabled:opacity-50"
        >
          {gpsStatus === 'requesting' ? 'Menyiapkan...' : '▶ Mulai Tracking'}
        </button>
        {submitError && <p className="text-coral text-sm font-bold">{submitError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status GPS */}
      <div
        className={cn(
          'border-2 border-ink px-4 py-2 text-sm font-extrabold text-center',
          gpsStatus === 'active' && 'bg-lime',
          gpsStatus === 'searching' && 'bg-amber-100 animate-pulse',
          gpsStatus === 'denied' && 'bg-coral text-cream',
        )}
      >
        {gpsStatus === 'active' && '🛰 GPS aktif'}
        {gpsStatus === 'searching' && '⏳ Menunggu sinyal GPS...'}
        {gpsStatus === 'denied' &&
          'Akses lokasi ditolak — izinkan lokasi di pengaturan browser lalu mulai ulang'}
      </div>

      {/* Jarak utama */}
      <div className="text-center">
        <p className="text-7xl font-extrabold tabular-nums leading-none">{formatKm(distanceM)}</p>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted mt-1">
          dari {formatKm(targetM)} km
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-5 border-2 border-ink bg-cream-2">
          <div
            className={cn('h-full transition-[width] duration-700', reached ? 'bg-lime' : 'bg-ink')}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs font-bold text-muted mt-1 text-right">{progressPct.toFixed(0)}%</p>
      </div>

      {/* Waktu & kecepatan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-ink p-4 text-center bg-cream shadow-hard-sm">
          <p className="text-2xl font-extrabold tabular-nums">{formatClock(elapsedSec)}</p>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Waktu</p>
        </div>
        <div className="border-2 border-ink p-4 text-center bg-cream shadow-hard-sm">
          <p className="text-2xl font-extrabold tabular-nums">{avgKmh.toFixed(1)}</p>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">km/jam rata-rata</p>
        </div>
      </div>

      {isSubmitting && <p className="text-center text-sm font-semibold text-muted">Menyimpan hasil...</p>}
      {submitError && (
        <div className="border-2 border-coral px-4 py-2 text-center space-y-2">
          <p className="text-coral text-sm font-semibold">{submitError}</p>
          {reached && (
            <button onClick={handleSubmit} className="text-sm font-extrabold underline decoration-lime decoration-2">
              Coba kirim ulang
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleCancel}
        className="w-full text-xs font-extrabold underline decoration-coral decoration-2 text-muted"
      >
        Batalkan misi
      </button>
    </div>
  );
}
