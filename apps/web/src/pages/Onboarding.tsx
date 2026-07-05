import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { cn } from '../lib/cn';

type Gender = 'MALE' | 'FEMALE';
type PermStatus = 'idle' | 'granted' | 'denied';

const cardClass = 'border-2 border-ink p-6 shadow-hard bg-cream';
const buttonClass =
  'w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed';

export default function Onboarding() {
  const navigate = useNavigate();
  const [gender, setGender] = useState<Gender | null>(null);
  const [locationStatus, setLocationStatus] = useState<PermStatus>('idle');
  const [notifStatus, setNotifStatus] = useState<PermStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('granted'),
      () => setLocationStatus('denied'),
    );
  }

  async function requestNotification() {
    if (!('Notification' in window)) {
      setNotifStatus('denied');
      return;
    }
    const result = await Notification.requestPermission();
    setNotifStatus(result === 'granted' ? 'granted' : 'denied');
  }

  async function finish() {
    if (!gender) return;
    setSubmitting(true);
    try {
      await api.post('/me/onboarding', { gender });
      navigate('/dashboard');
    } catch {
      setError('Gagal menyimpan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  const permLabel = (status: PermStatus) =>
    status === 'granted' ? '✓ Diizinkan' : status === 'denied' ? '✗ Ditolak' : 'Izinkan';

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">Selamat datang! 🎉</h1>
          <p className="text-muted font-semibold text-sm">
            Beberapa langkah lagi sebelum petualanganmu dimulai.
          </p>
        </div>

        <div className={cardClass}>
          <h2 className="text-xs font-extrabold uppercase tracking-widest mb-3">1. Pilih gender</h2>
          <p className="text-sm text-muted font-medium mb-4">
            Menentukan variasi pet yang akan kamu dapatkan.
          </p>
          <div className="flex gap-3">
            {(['MALE', 'FEMALE'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={cn(
                  'flex-1 py-4 border-2 border-ink font-extrabold text-sm transition-colors',
                  gender === g ? 'bg-ink text-cream' : 'bg-cream-2 hover:bg-lime-100',
                )}
              >
                {g === 'MALE' ? '♂ Laki-laki' : '♀ Perempuan'}
              </button>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-xs font-extrabold uppercase tracking-widest mb-3">2. Izin akses</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm">📍 Lokasi</p>
                <p className="text-xs text-muted font-medium">
                  Untuk misi outdoor: jalan kaki, lari, dan aktivitas fisik lainnya.
                </p>
              </div>
              <button
                onClick={requestLocation}
                disabled={locationStatus === 'granted'}
                className={cn(
                  'shrink-0 px-3 py-2 text-xs font-extrabold border-2 border-ink transition-colors',
                  locationStatus === 'granted' ? 'bg-lime-100' : 'hover:bg-ink hover:text-cream',
                )}
              >
                {permLabel(locationStatus)}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm">🔔 Notifikasi</p>
                <p className="text-xs text-muted font-medium">
                  Pengingat daily mission, streak, dan event penting.
                </p>
              </div>
              <button
                onClick={requestNotification}
                disabled={notifStatus === 'granted'}
                className={cn(
                  'shrink-0 px-3 py-2 text-xs font-extrabold border-2 border-ink transition-colors',
                  notifStatus === 'granted' ? 'bg-lime-100' : 'hover:bg-ink hover:text-cream',
                )}
              >
                {permLabel(notifStatus)}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="border-2 border-coral bg-red-50 px-3 py-2">
            <p className="text-coral text-sm font-semibold">{error}</p>
          </div>
        )}

        <button onClick={finish} disabled={!gender || submitting} className={buttonClass}>
          {submitting ? 'Menyimpan...' : 'Mulai Petualangan →'}
        </button>
        <p className="text-center text-xs text-muted font-medium">
          Izin bisa diubah kapan saja lewat pengaturan browser.
        </p>
      </div>
    </div>
  );
}
