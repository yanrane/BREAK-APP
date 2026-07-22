import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/cn';

// Konfigurasi Red Warning: default 20 menit; override via localStorage
// 'break_usage_limit_min' kalau mau diatur tanpa deploy
const DEFAULT_LIMIT_MIN = 20;
const STORAGE_KEY = 'break_usage_elapsed_sec';
const UNDERSTAND_DELAY_S = 5;

function limitSec(): number {
  const override = parseInt(localStorage.getItem('break_usage_limit_min') ?? '', 10);
  return (Number.isFinite(override) && override > 0 ? override : DEFAULT_LIMIT_MIN) * 60;
}

/**
 * Red Warning System — pengingat pemakaian sehat. Timer hanya berjalan saat
 * tab benar-benar aktif (Visibility API); pindah tab/minimize/layar mati =
 * pause otomatis. Status tersimpan di localStorage agar tahan refresh.
 * Tidak pernah muncul di tengah sesi misi yang sedang berjalan.
 */
export default function UsageGuard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(UNDERSTAND_DELAY_S);
  const elapsedRef = useRef<number>(parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) || 0);
  const showRef = useRef(false);

  // Jangan ganggu sesi misi yang sedang berjalan
  const onMissionSession = /^\/missions\/[^/]+\/active$/.test(pathname);

  useEffect(() => {
    const persist = () => localStorage.setItem(STORAGE_KEY, String(elapsedRef.current));
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible' || showRef.current) return;
      elapsedRef.current += 1;
      if (elapsedRef.current % 5 === 0) persist();
      if (elapsedRef.current >= limitSec()) {
        showRef.current = true;
        setCountdown(UNDERSTAND_DELAY_S);
        setShow(true);
      }
    }, 1000);
    window.addEventListener('beforeunload', persist);
    document.addEventListener('visibilitychange', persist);
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', persist);
      document.removeEventListener('visibilitychange', persist);
    };
  }, []);

  // Overlay tertunda selama user berada di sesi misi — muncul setelah keluar
  const visible = show && !onMissionSession;

  // Countdown sebelum tombol "Saya Mengerti" bisa ditekan + kunci scroll
  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = 'hidden';
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => {
      document.body.style.overflow = '';
      clearInterval(id);
    };
  }, [visible]);

  const reset = () => {
    elapsedRef.current = 0;
    localStorage.setItem(STORAGE_KEY, '0');
    showRef.current = false;
    setShow(false);
  };

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Peringatan pemakaian"
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
      style={{ background: 'linear-gradient(160deg, #B91C1C 0%, #7F1D1D 100%)' }}
    >
      <div className="max-w-md w-full text-center text-white space-y-6">
        <div className="text-7xl animate-warn" aria-hidden="true">⚠️</div>
        <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
          Kamu sudah cukup lama di BREAK.
        </h2>
        <p className="text-white/85 font-medium leading-relaxed">
          BREAK dibuat supaya kamu lebih banyak menjalani hidup — bukan lebih lama menatap
          website ini. Istirahat dulu, lanjutkan misimu di dunia nyata.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => {
              reset();
              navigate('/missions');
            }}
            className="w-full py-4 text-lg font-extrabold border-2 border-white bg-white text-red-800 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            🚀 Mulai Misi Sekarang
          </button>
          <button
            onClick={reset}
            disabled={countdown > 0}
            className={cn(
              'w-full py-2.5 text-sm font-bold border-2 border-white/50 text-white/80 transition-all duration-100',
              countdown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10',
            )}
          >
            {countdown > 0 ? `Saya Mengerti (${countdown})` : 'Saya Mengerti'}
          </button>
        </div>
      </div>
    </div>
  );
}
