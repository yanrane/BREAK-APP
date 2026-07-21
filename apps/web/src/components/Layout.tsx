import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';
import { cn } from '../lib/cn';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/missions', label: 'Misi' },
  { to: '/leaderboard', label: 'Ranking' },
  { to: '/games', label: 'Games' },
  { to: '/shop', label: 'Shop' },
  { to: '/profile', label: 'Profil' },
];

interface ActiveEvent {
  title: string;
  expMultiplier: number;
  endsAt: string;
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);

  useEffect(() => {
    if (!user) {
      setActiveEvent(null);
      return;
    }
    api
      .get<{ success: true; data: ActiveEvent | null }>('/events/active')
      .then((res) => setActiveEvent(res.data.data))
      .catch(() => setActiveEvent(null));
  }, [user]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-cream border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="text-xl font-extrabold tracking-tight shrink-0 hover:text-muted transition-colors"
          >
            BREAK
          </Link>

          {/* Desktop nav */}
          {user ? (
            <nav className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-1.5 text-sm font-semibold transition-colors',
                    pathname === to
                      ? 'bg-ink text-cream'
                      : 'hover:bg-cream-2 text-ink',
                  )}
                >
                  {label}
                </Link>
              ))}
              <span className="text-muted text-xs ml-2 hidden md:inline font-medium">
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
            <nav className="hidden sm:flex items-center gap-2">
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

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col justify-center gap-1.5 w-8 h-8 shrink-0"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            <span className={cn('block h-0.5 bg-ink transition-all duration-200 origin-center', menuOpen && 'rotate-45 translate-y-2')} />
            <span className={cn('block h-0.5 bg-ink transition-all duration-200', menuOpen && 'opacity-0')} />
            <span className={cn('block h-0.5 bg-ink transition-all duration-200 origin-center', menuOpen && '-rotate-45 -translate-y-2')} />
          </button>
        </div>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="sm:hidden border-t-2 border-ink bg-cream">
            {user ? (
              <div className="divide-y-2 divide-ink/20">
                {NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeMenu}
                    className={cn(
                      'flex items-center px-5 py-4 text-base font-extrabold transition-colors',
                      pathname === to ? 'bg-ink text-cream' : 'hover:bg-cream-2',
                    )}
                  >
                    {label}
                  </Link>
                ))}
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-extrabold border-2 border-ink px-4 py-2 hover:bg-ink hover:text-cream transition-colors"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 flex gap-3">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 text-center py-3 text-sm font-extrabold border-2 border-ink transition-colors hover:bg-cream-2"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 text-center py-3 text-sm font-extrabold border-2 border-ink bg-ink text-cream"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {user && activeEvent && (
        <div className="bg-amber-100 border-b-2 border-ink">
          <p className="max-w-5xl mx-auto px-5 py-2 text-sm font-extrabold">
            ⚡ {activeEvent.title} — semua EXP ×{activeEvent.expMultiplier} sampai{' '}
            {new Date(activeEvent.endsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}!
          </p>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-5 py-8 w-full flex-1">
        <Outlet />
      </main>

      <footer className="border-t-2 border-ink">
        <div className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between flex-wrap gap-3 text-sm">
          <span className="font-extrabold tracking-tight">BREAK</span>
          <nav className="flex gap-5 font-semibold text-muted">
            <Link to="/about" className="hover:text-ink transition-colors">
              Tentang
            </Link>
            {user && (
              <Link to="/feedback" className="hover:text-ink transition-colors">
                Feedback
              </Link>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
