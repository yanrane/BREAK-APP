import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../lib/schemas';
import api from '../lib/api';
import { cn } from '../lib/cn';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Gagal mengirim. Coba lagi.';
      setError('root', { message });
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-3xl font-extrabold tracking-tight mb-1">
          BREAK
        </Link>
        <p className="text-muted font-semibold mb-8 text-sm">Reset password akunmu</p>

        <div className="border-2 border-ink p-6 shadow-hard bg-cream">
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold">
                ✉️ Jika email terdaftar, link reset password sudah dikirim. Cek inbox (dan folder
                spam) — link berlaku 1 jam.
              </p>
              <Link
                to="/login"
                className="block text-center w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-muted font-medium">
                Masukkan email akunmu. Kami akan kirim link untuk membuat password baru.
              </p>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={cn(
                    'w-full px-3 py-2.5 border-2 border-ink bg-cream-2 font-medium text-sm',
                    'focus:outline-none focus:bg-lime-100 transition-colors',
                    errors.email && 'border-coral bg-red-50',
                  )}
                />
                {errors.email && (
                  <p className="text-coral text-xs mt-1 font-semibold">{errors.email.message}</p>
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
                {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset →'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted font-semibold mt-5">
          Ingat passwordmu?{' '}
          <Link to="/login" className="text-ink font-extrabold underline decoration-lime decoration-2">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
