import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedbackSchema, type FeedbackInput } from '../lib/schemas';
import api from '../lib/api';
import { cn } from '../lib/cn';

const CATEGORIES: { value: FeedbackInput['category']; label: string }[] = [
  { value: 'BUG_REPORT', label: '🐛 Bug Report' },
  { value: 'SUGGESTION', label: '💡 Saran' },
  { value: 'COMPLAINT', label: '😤 Keluhan' },
  { value: 'OTHER', label: '💬 Lainnya' },
];

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  NEW: { label: 'Baru', cls: 'bg-cream-2' },
  IN_REVIEW: { label: 'Ditinjau', cls: 'bg-amber-100' },
  RESOLVED: { label: 'Selesai', cls: 'bg-lime' },
};

interface FeedbackItem {
  id: string;
  category: FeedbackInput['category'];
  title: string;
  message: string;
  status: 'NEW' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
}

const inputClass =
  'w-full border-2 border-ink bg-cream px-3 py-2.5 text-sm font-medium focus:outline-none focus:bg-cream-2 transition-colors';

export default function Feedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FeedbackInput>({ resolver: zodResolver(feedbackSchema) });

  const fetchMine = useCallback(async () => {
    try {
      const res = await api.get<{ success: true; data: FeedbackItem[] }>('/feedback/mine');
      setItems(res.data.data);
    } catch {
      // list gagal dimuat bukan blocker form — biarkan kosong
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  async function onSubmit(data: FeedbackInput) {
    try {
      setSuccess(false);
      await api.post('/feedback', data);
      reset();
      setSuccess(true);
      fetchMine();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Gagal mengirim feedback. Coba lagi.';
      setError('root', { message });
    }
  }

  return (
    <div className="max-w-xl">
      <div className="border-b-2 border-ink pb-5 mb-6">
        <p className="text-label mb-1">Bantu BREAK jadi lebih baik</p>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">Feedback</h1>
      </div>

      {success && (
        <div className="border-2 border-ink bg-lime px-4 py-3 shadow-hard-sm mb-6">
          <p className="font-extrabold text-sm">✓ Feedback terkirim. Makasih, ya!</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-10" noValidate>
        <div>
          <label htmlFor="fb-category" className="block text-xs font-extrabold uppercase tracking-widest mb-1.5">
            Kategori
          </label>
          <select id="fb-category" {...register('category')} defaultValue="" className={inputClass}>
            <option value="" disabled>
              Pilih kategori...
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-coral text-xs font-bold mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="fb-title" className="block text-xs font-extrabold uppercase tracking-widest mb-1.5">
            Judul Singkat
          </label>
          <input
            id="fb-title"
            type="text"
            placeholder="Contoh: Tombol start misi tidak merespons"
            {...register('title')}
            className={inputClass}
          />
          {errors.title && <p className="text-coral text-xs font-bold mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="fb-message" className="block text-xs font-extrabold uppercase tracking-widest mb-1.5">
            Pesan
          </label>
          <textarea
            id="fb-message"
            rows={5}
            placeholder="Ceritakan detailnya di sini..."
            {...register('message')}
            className={cn(inputClass, 'resize-y')}
          />
          {errors.message && (
            <p className="text-coral text-xs font-bold mt-1">{errors.message.message}</p>
          )}
        </div>

        {errors.root && <p className="text-coral text-sm font-bold">{errors.root.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Feedback →'}
        </button>
      </form>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-3">
          Feedback Kamu
        </p>

        {listLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 border-2 border-ink/20 bg-cream-2 animate-pulse" />
            ))}
          </div>
        )}

        {!listLoading && items.length === 0 && (
          <div className="border-2 border-ink p-8 shadow-hard text-center">
            <p className="text-3xl mb-3">📮</p>
            <p className="text-sm text-muted font-semibold">
              Belum ada feedback. Kirim yang pertama di atas!
            </p>
          </div>
        )}

        {!listLoading && items.length > 0 && (
          <div className="border-2 border-ink shadow-hard divide-y-2 divide-ink">
            {items.map((item) => {
              const status = STATUS_STYLE[item.status] ?? STATUS_STYLE.NEW;
              return (
                <div key={item.id} className="px-4 py-3 bg-cream">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="font-extrabold text-sm truncate">{item.title}</p>
                    <span
                      className={cn(
                        'shrink-0 px-2 py-0.5 text-xs font-extrabold border-2 border-ink',
                        status.cls,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted font-semibold">
                    {CATEGORY_LABEL[item.category]} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
