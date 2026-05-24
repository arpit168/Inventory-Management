import { BarChart3, BellRing, Boxes, Home, LogOut, Settings, ShoppingCart, TriangleAlert, Moon, Sun } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/out-of-stock', label: 'Out of Stock', icon: TriangleAlert },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: BellRing },
  { to: '/profile', label: 'Profile', icon: Settings },
];

const Layout = () => {
  const { user, theme, toggleTheme, logout, notifications } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75 p-5 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-300">Inventory Pro</p>
              <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Shopkeeper Suite</h1>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-full border border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-cyan-400/40 dark:bg-cyan-400/10 px-3 py-2 text-sm text-slate-700 dark:text-cyan-100 transition-all duration-300 hover:shadow-md"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 dark:border-cyan-400/30 dark:bg-cyan-400/10 p-4 shadow-sm dark:shadow-none">
            <p className="text-sm text-slate-600 dark:text-slate-200">Welcome back</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{user?.name || 'Shopkeeper'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-300">{user?.email}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/20 dark:text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-100 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg"
          >
            <LogOut size={16} />
            Logout
          </button>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300">Premium inventory control</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{location.pathname === '/dashboard' ? 'Command center' : 'Inventory management'}</h2>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/70 px-4 py-3 shadow-sm dark:shadow-none">
              <ShoppingCart size={18} className="text-cyan-600 dark:text-cyan-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Alerts</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{notifications.filter((item) => !item.read).length} unread</p>
              </div>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
