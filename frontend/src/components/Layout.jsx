import {
  BarChart3,
  BellRing,
  Boxes,
  Home,
  LogOut,
  Settings,
  ShoppingCart,
  TriangleAlert,
  Moon,
  Sun,
  Menu,

} from 'lucide-react';

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

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

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        
        {/* ================= MOBILE OVERLAY ================= */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* ================= SIDEBAR ================= */}
        <aside
          className={`
            fixed left-0 top-0 z-50 h-screen w-72 transform border-r border-slate-200
            bg-white/90 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300
            dark:border-white/10 dark:bg-slate-950/90

            ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }

            lg:translate-x-0
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-300">
                Inventory Pro
              </p>

              <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                Shopkeeper Suite
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="rounded-xl border border-slate-200 bg-slate-100 p-2 transition-all duration-300 hover:scale-105 hover:bg-slate-200 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:hover:bg-cyan-400/20"
              >
                {theme === 'light' ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>

             
             
            </div>
          </div>

          {/* User Card */}
          <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/10 to-blue-500/10 p-4 backdrop-blur-xl">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Welcome back
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {user?.name || 'Shopkeeper'}
            </p>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>

          {/* Nav Links */}
          <nav className="mt-8 space-y-2">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;

              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    active
                      ? 'bg-linear-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    size={18}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />

                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={logout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-500 transition-all duration-300 hover:bg-rose-500 hover:text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <div className="flex flex-1 flex-col lg:ml-72">
          
          {/* ================= TOPBAR ================= */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/70 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              
              {/* Left */}
              <div className="flex items-center gap-4">
                {/* Hamburger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-xl border  border-slate-200 bg-white  shadow-sm transition-all duration-300 hover:scale-105 dark:border-white/10 dark:bg-white/5   "
                >
                  <Menu size={20} className='md:hidden lg:hidden' />
                </button>

                <div>
                  <p className="text-xs text-nowrap uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300">
                    Hey! {user?.name || 'Shopkeeper'}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                    {location.pathname === '/dashboard'
                      ? 'Command Center'
                      : 'Inventory Management'}
                  </h2>
                </div>
              </div>

              {/* Alerts */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                <ShoppingCart
                  size={18}
                  className="text-cyan-600 dark:text-cyan-300"
                />

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                    Alerts
                  </p>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {notifications.filter((item) => !item.read).length} unread
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* ================= PAGE CONTENT ================= */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;