import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { registerSchema, type RegisterInput } from '@break/shared';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/cn';

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    try {
      const res = await api.post('/auth/register', data);
      const { accessToken, refreshToken, user } = res.data.data;
      setAuth({ accessToken, refreshToken }, user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Registrasi gagal. Coba lagi.';
      setError('root', { message });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">BREAK</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Buat akun baru</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.email && 'border-red-500',
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              {...register('username')}
              type="text"
              autoComplete="username"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.username && 'border-red-500',
              )}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.password && 'border-red-500',
              )}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-red-500 text-sm text-center">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-2 px-4 rounded-lg font-medium text-sm text-white',
              'bg-brand-600 hover:bg-brand-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isSubmitting ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
