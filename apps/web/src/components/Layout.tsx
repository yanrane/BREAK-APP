import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/cn';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/missions', label: 'Misi' },
  { to: '/leaderboard', label: 'Ranking' },
  { to: '/games', label: 'Games' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 bg-cream border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-6">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight shrink-0 hover:text-muted transition-colors"
          >
            BREAK
          </Link>

          {user ? (
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-1.5 text-sm font-semibold rounded transition-colors',
                    pathname === to
                      ? 'bg-ink text-cream'
                      : 'hover:bg-cream-2 text-ink',
                  )}
                >
                  {label}
                </Link>
              ))}
              <span className="text-muted text-xs ml-2 hidden sm:inline font-medium">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="ml-1 px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors"
              >
                Keluar
              </button>
            </nav>
          ) : (
            <nav className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 text-sm font-semibold hover:text-muted transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-bold border-2 border-ink bg-ink text-cream shadow-hard-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
              >
                Daftar
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10">
        <Outlet />
      </main>
    </div>
  );
}
