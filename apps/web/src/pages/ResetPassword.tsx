import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordInput } from '../lib/schemas';
import api from '../lib/api';
import { cn } from '../lib/cn';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(data: ResetPasswordInput) {
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      setDone(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Gagal mengubah password. Coba lagi.';
      setError('root', { message });
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-3xl font-extrabold tracking-tight mb-1">
          BREAK
        </Link>
        <p className="text-muted font-semibold mb-8 text-sm">Buat password baru</p>

        <div className="border-2 border-ink p-6 shadow-hard bg-cream">
          {!token ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-coral">
                Link reset tidak valid — token tidak ditemukan.
              </p>
              <Link
                to="/forgot-password"
                className="block text-center w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
              >
                Minta Link Baru
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold">
                ✅ Password berhasil diubah. Silakan login dengan password barumu.
              </p>
              <Link
                to="/login"
                className="block text-center w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
              >
                Masuk →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2">
                  Password Baru
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className={cn(
                    'w-full px-3 py-2.5 border-2 border-ink bg-cream-2 font-medium text-sm',
                    'focus:outline-none focus:bg-lime-100 transition-colors',
                    errors.password && 'border-coral bg-red-50',
                  )}
                />
                {errors.password && (
                  <p className="text-coral text-xs mt-1 font-semibold">{errors.password.message}</p>
                )}
              </div>

              {errors.root && (
                <div className="border-2 border-coral bg-red-50 px-3 py-2">
                  <p className="text-coral text-sm font-semibold">{errors.root.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
