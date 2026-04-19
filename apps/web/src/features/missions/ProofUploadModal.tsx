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
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    onSubmit(selectedFile);
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Upload Bukti</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{missionTitle}</p>

        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
            'border-gray-300 dark:border-gray-600 hover:border-brand-500',
            preview && 'p-0 border-solid',
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <div className="py-6 space-y-2">
              <p className="text-3xl">📷</p>
              <p className="text-sm text-gray-500">Klik untuk pilih foto</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP · Maks 5MB</p>
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
          <p className="text-red-500 text-xs">{fileError}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors',
              'bg-brand-600 hover:bg-brand-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isSubmitting ? 'Mengunggah...' : 'Kirim Bukti'}
          </button>
        </div>
      </div>
    </div>
  );
}
