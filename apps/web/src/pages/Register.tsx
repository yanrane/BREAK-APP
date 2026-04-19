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

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full px-3 py-2.5 border-2 border-ink bg-cream-2 font-medium text-sm',
      'focus:outline-none focus:bg-lime-100 transition-colors',
      hasError && 'border-coral bg-red-50',
    );

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-3xl font-extrabold tracking-tight mb-1">
          BREAK
        </Link>
        <p className="text-muted font-semibold mb-8 text-sm">Buat akun baru — gratis</p>

        <div className="border-2 border-ink p-6 shadow-hard bg-cream">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest mb-2">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={inputClass(!!errors.email)}
              />
              {errors.email && <p className="text-coral text-xs mt-1 font-semibold">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest mb-2">Username</label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className={inputClass(!!errors.username)}
              />
              {errors.username && <p className="text-coral text-xs mt-1 font-semibold">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest mb-2">Password</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className={inputClass(!!errors.password)}
              />
              {errors.password && <p className="text-coral text-xs mt-1 font-semibold">{errors.password.message}</p>}
            </div>

            {errors.root && (
              <div className="border-2 border-coral bg-red-50 px-3 py-2">
                <p className="text-coral text-sm font-semibold">{errors.root.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream shadow-hard hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-hard"
            >
              {isSubmitting ? 'Mendaftar...' : 'Buat Akun →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted font-semibold mt-5">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-ink font-extrabold underline decoration-lime decoration-2">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
