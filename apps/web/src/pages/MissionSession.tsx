import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTodayMissions } from '../features/missions/useMissions';
import CameraCapture from '../features/missions/CameraCapture';
import api from '../lib/api';

type Phase = 'ready' | 'countdown' | 'capture' | 'done';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MissionSession() {
  const { userMissionId } = useParams<{ userMissionId: string }>();
  const navigate = useNavigate();
  const { missions, loading, startMission, cancelMission, completeMission } = useTodayMissions();

  const containerRef = useRef<HTMLDivElement>(null);
  // endAtMs dihitung dari startedAt + serverNow (jam server) — jam device hanya untuk delta tampilan
  const endAtRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const userMission = missions.find((m) => m.id === userMissionId);
  const mission = userMission?.mission;
  const hasTimer = mission ? mission.proofType !== 'PHOTO' : false;
  const hasPhoto = mission ? mission.proofType !== 'TIMER' : false;

  // Countdown tick (display only — server yang memvalidasi waktu sebenarnya)
  useEffect(() => {
    if (phase !== 'countdown' || paused) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil(((endAtRef.current ?? 0) - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setPhase(hasPhoto ? 'capture' : 'done');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, paused, hasPhoto]);

  // Focus Mode: keluar fullscreen / pindah tab = pause
  useEffect(() => {
    if (phase !== 'countdown') return;
    const onLeave = () => {
      if (document.hidden || !document.fullscreenElement) setPaused(true);
    };
    const onVisibility = () => {
      // Pindah tab / minimize dicatat untuk analitik — fire and forget
      if (document.hidden && userMissionId) {
        api.post(`/missions/${userMissionId}/exit`).catch(() => {});
      }
      onLeave();
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onLeave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onLeave);
    };
  }, [phase, userMissionId]);

  // Anti-exit ringan selama sesi berjalan
  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'capture') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [phase]);

  const enterFullscreen = useCallback(() => {
    // Fire-and-forget: promise requestFullscreen bisa menggantung menunggu izin di sebagian
    // browser — jangan pernah di-await agar transisi sesi tidak ikut tertahan.
    // Ditolak (iOS Safari) juga aman: sesi tetap jalan, pause tetap aktif via visibilitychange.
    containerRef.current?.requestFullscreen().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const handleStart = async () => {
    if (!userMissionId || !mission) return;
    try {
      setSubmitError(null);
      const { userMission: um, serverNow } = await startMission(userMissionId);
      if (hasTimer && mission.durationMinutes && um.startedAt) {
        const elapsedMs = new Date(serverNow).getTime() - new Date(um.startedAt).getTime();
        endAtRef.current = Date.now() + mission.durationMinutes * 60 * 1000 - elapsedMs;
        setPaused(false);
        setPhase('countdown');
        enterFullscreen();
      } else {
        setPhase('capture');
      }
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
        ?.response?.data?.error;
      // Pesan jendela jam mulai dari server lebih informatif dari pesan generik
      if (
        (apiErr?.code === 'MISSION_START_NOT_OPEN' || apiErr?.code === 'MISSION_START_CLOSED') &&
        apiErr.message
      ) {
        setSubmitError(apiErr.message);
      } else {
        setSubmitError('Gagal memulai misi. Coba lagi.');
      }
    }
  };

  const handleCancel = async () => {
    if (!userMissionId) return;
    exitFullscreen();
    try { await cancelMission(userMissionId); } catch { /* status di server mungkin sudah berubah */ }
    navigate('/missions');
  };

  const handleComplete = async (file?: File) => {
    if (!userMissionId) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await completeMission(userMissionId, file);
      exitFullscreen();
      navigate('/missions');
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })
        ?.response?.data?.error?.code;
      if (code === 'TIMER_NOT_ELAPSED') {
        // Jam server bilang belum selesai (jam device kecepatan) — rekalibrasi endAt
        // dari server via start idempoten, supaya countdown tidak bounce balik ke 0
        setSubmitError('Timer server belum selesai — tunggu sebentar lagi.');
        try {
          const { userMission: um, serverNow } = await startMission(userMissionId);
          if (mission?.durationMinutes && um.startedAt) {
            const elapsedMs = new Date(serverNow).getTime() - new Date(um.startedAt).getTime();
            endAtRef.current = Date.now() + mission.durationMinutes * 60 * 1000 - elapsedMs;
          }
        } catch { /* pakai endAt lama kalau rekalibrasi gagal */ }
        setPaused(false);
        setPhase('countdown');
      } else if (code === 'PROOF_DUPLICATE') {
        setSubmitError('Foto ini sudah pernah dipakai. Jepret foto baru ya.');
      } else {
        setSubmitError('Gagal menyelesaikan misi. Coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-60 border-2 border-ink/20 bg-cream-2 animate-pulse" />;

  if (!userMission || !mission) {
    return (
      <div className="border-2 border-ink p-10 shadow-hard text-center">
        <p className="font-extrabold text-lg mb-2">Misi tidak ditemukan</p>
        <button onClick={() => navigate('/missions')} className="text-sm font-extrabold underline decoration-lime decoration-2">
          ← Kembali ke Misi Harian
        </button>
      </div>
    );
  }

  if (userMission.status === 'VERIFIED' || userMission.status === 'COMPLETED') {
    return (
      <div className="border-2 border-ink p-10 shadow-hard text-center bg-lime">
        <p className="text-4xl mb-3">✓</p>
        <p className="font-extrabold text-lg mb-2">Misi sudah selesai!</p>
        <button onClick={() => navigate('/missions')} className="text-sm font-extrabold underline decoration-2">
          ← Kembali ke Misi Harian
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-xl bg-cream min-h-full p-1">
      <div className="border-b-2 border-ink pb-4 mb-6">
        <p className="text-label mb-1">Sesi Misi</p>
        <h1 className="text-3xl font-extrabold leading-tight">{mission.title}</h1>
        <p className="text-sm text-muted font-medium mt-1">{mission.description}</p>
      </div>

      {phase === 'ready' && (
        <div className="text-center space-y-4">
          {hasTimer && (
            <p className="text-6xl font-extrabold">{formatTime((mission.durationMinutes ?? 0) * 60)}</p>
          )}
          <button
            onClick={handleStart}
            className="w-full py-4 text-lg font-extrabold border-2 border-ink bg-ink text-cream shadow-hard"
          >
            ▶ Mulai Misi
          </button>
          {hasTimer && (
            <p className="text-xs text-muted font-semibold">
              Misi berjalan fullscreen. Keluar dari layar = timer dijeda.
            </p>
          )}
        </div>
      )}

      {phase === 'countdown' && !paused && (
        <div className="text-center space-y-6">
          <p className="text-7xl font-extrabold tabular-nums">{formatTime(remaining)}</p>
          <p className="text-sm text-muted font-semibold">Tetap fokus — jangan tinggalkan layar ini.</p>
          <button onClick={handleCancel} className="text-xs font-extrabold underline decoration-coral decoration-2 text-muted">
            Batalkan misi
          </button>
        </div>
      )}

      {phase === 'countdown' && paused && (
        <div className="border-2 border-coral p-8 text-center space-y-4 shadow-hard-coral">
          <p className="text-3xl">⏸</p>
          <p className="font-extrabold text-lg">Misi dijeda</p>
          <p className="text-sm text-muted font-medium">Kamu keluar dari mode fokus. Lanjutkan atau batalkan?</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setPaused(false); enterFullscreen(); }}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm"
            >
              Lanjutkan
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-coral text-coral"
            >
              Batalkan misi
            </button>
          </div>
        </div>
      )}

      {phase === 'capture' && (
        <div className="space-y-3">
          <p className="text-label">Bukti Misi — jepret langsung dari kamera</p>
          <CameraCapture isSubmitting={isSubmitting} onCapture={(file) => handleComplete(file)} />
        </div>
      )}

      {phase === 'done' && (
        <button
          onClick={() => handleComplete()}
          disabled={isSubmitting}
          className="w-full py-4 text-lg font-extrabold border-2 border-ink bg-lime shadow-hard disabled:opacity-50"
        >
          {isSubmitting ? 'Mengirim…' : '✓ Selesaikan Misi'}
        </button>
      )}

      {submitError && (
        <div className="border-2 border-coral px-4 py-2 mt-4">
          <p className="text-coral text-sm font-semibold">{submitError}</p>
        </div>
      )}
    </div>
  );
}
