import { useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface ProofUploadModalProps {
  isOpen: boolean;
  missionTitle: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

export default function ProofUploadModal({
  isOpen,
  missionTitle,
  isSubmitting,
  onClose,
  onSubmit,
}: ProofUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Hanya JPG, PNG, dan WEBP yang diizinkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 5MB');
      return;
    }
    setSelectedFile(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    onSubmit(selectedFile);
  };

  const handleClose = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/60"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm bg-cream border-2 border-ink shadow-hard-lg p-6 space-y-4 animate-fade-up">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-label mb-0.5">Upload Bukti</p>
            <h2 className="font-extrabold text-base leading-tight">{missionTitle}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-ink font-bold text-lg leading-none shrink-0 transition-colors"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div
          className={cn(
            'border-2 border-dashed border-ink cursor-pointer transition-colors',
            'hover:bg-lime-100',
            preview ? 'p-0 border-solid' : 'p-6 text-center',
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          ) : (
            <div className="space-y-2">
              <p className="text-4xl">📷</p>
              <p className="text-sm font-bold">Klik untuk pilih foto</p>
              <p className="text-xs text-muted font-semibold">JPG, PNG, WEBP · Maks 5MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {fileError && (
          <div className="border-2 border-coral px-3 py-1.5">
            <p className="text-coral text-xs font-extrabold">{fileError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink text-ink shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className="flex-1 py-2.5 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-hard-sm"
          >
            {isSubmitting ? 'Mengunggah...' : 'Kirim Bukti →'}
          </button>
        </div>
      </div>
    </div>
  );
}
