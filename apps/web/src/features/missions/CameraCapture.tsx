import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  isSubmitting: boolean;
  onCapture: (file: File) => void;
}

/**
 * Panel kamera live — bukti misi WAJIB dijepret di sini, tidak ada input galeri
 * (aturan anti-curang: foto lama/orang lain tidak bisa dipakai).
 */
export default function CameraCapture({ isSubmitting, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (previewBlob) return; // kamera mati selama preview

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError(true));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [previewBlob]);

  useEffect(() => {
    if (!previewBlob) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewBlob]);

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) setPreviewBlob(blob); }, 'image/jpeg', 0.85);
  };

  const handleSubmit = () => {
    if (!previewBlob) return;
    onCapture(new File([previewBlob], 'proof.jpg', { type: 'image/jpeg' }));
  };

  if (cameraError) {
    return (
      <div className="border-2 border-coral p-6 text-center">
        <p className="text-3xl mb-3">📵</p>
        <p className="font-extrabold mb-1">Kamera tidak tersedia</p>
        <p className="text-sm text-muted font-medium">
          Misi ini butuh foto langsung dari kamera. Buka BREAK di HP kamu, lalu izinkan akses kamera.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Preview bukti" className="w-full border-2 border-ink" />
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewBlob(null)}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink bg-cream shadow-hard-sm"
            >
              ↺ Ulangi
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Mengirim…' : 'Kirim Bukti →'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* playsInline wajib supaya iOS Safari tidak memaksa fullscreen video */}
          <video ref={videoRef} autoPlay playsInline muted className="w-full border-2 border-ink bg-ink" />
          <button
            onClick={handleSnap}
            className="w-full py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm"
          >
            📸 Jepret
          </button>
        </>
      )}
    </div>
  );
}
