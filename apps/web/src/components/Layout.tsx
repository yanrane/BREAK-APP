import { Link, Outlet } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/cn';

export default function Layout() {
  const { isDark, toggle } = useThemeStore();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-brand-600 dark:text-brand-500">
          BREAK
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm hover:underline">Dashboard</Link>
          <Link to="/missions" className="text-sm hover:underline">Misi</Link>
          <Link to="/leaderboard" className="text-sm hover:underline">Leaderboard</Link>
          <Link to="/games" className="text-sm hover:underline">Games</Link>
          <button
            onClick={toggle}
            className={cn(
              'px-3 py-1 rounded-md text-sm border',
              'border-gray-300 dark:border-gray-600',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
            aria-label="Toggle dark mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
