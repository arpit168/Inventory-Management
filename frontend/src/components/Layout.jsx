import {
  BarChart3,
  BellRing,
  Boxes,
  Home,
  LogOut,
  Settings,
  ShoppingCart,
  TriangleAlert,
  Menu,
  ReceiptText,
  Users,
  Wallet,
  Sun,
  Moon,
  X,
} from 'lucide-react';

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/invoices', label: 'Billing / Invoices', icon: ReceiptText },
  { to: '/customers', label: 'Khatabook Ledger', icon: Users },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/out-of-stock', label: 'Out of Stock', icon: TriangleAlert },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: BellRing },
  { to: '/profile', label: 'Profile', icon: Settings },
];

const Layout = () => {
  const { user, logout, notifications, theme, toggleTheme } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="min-h-screen bg-background text-text flex overflow-x-hidden selection:bg-primary/20">
      
      {/* ================= MOBILE OVERLAY ================= */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-fade-in"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex flex-col h-screen w-72 border-r border-border
          bg-surface shadow-2xl transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header Section */}
        <div className="shrink-0 p-5 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-primary">
              Inventory Pro
            </p>
            <h1 className="mt-1 text-lg font-black tracking-tight text-text">
              Shopkeeper Suite
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="shrink-0 mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3.5 shadow-xs">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-11 w-11 rounded-xl object-cover border-2 border-primary shrink-0" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-tr from-cyan-500 to-blue-600 font-bold text-white shrink-0 shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-text-muted">Active Session</p>
            <p className="truncate text-sm font-bold text-text">{user?.name || 'Shopkeeper'}</p>
          </div>
        </div>

        {/* Nav Links Section (Independently Scrollable) */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;

            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-primary text-slate-950 shadow-md shadow-primary/20 font-bold'
                    : 'text-text-muted hover:bg-background hover:text-text'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-slate-950' : 'text-primary'}`}
                  />
                  <span>{label}</span>
                </div>
                {to === '/notifications' && unreadCount > 0 && (
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-slate-950 text-white' : 'bg-danger text-white animate-pulse'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Fixed Logout Button at Bottom */}
        <div className="shrink-0 p-4 border-t border-border bg-surface">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger transition-all duration-200 hover:bg-danger hover:text-white shadow-xs active:scale-[0.98]"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex flex-1 flex-col lg:ml-72 min-h-screen overflow-x-hidden">
        
        {/* ================= TOPBAR ================= */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/85 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl border border-border bg-background text-text hover:bg-surface transition shrink-0 shadow-xs"
                aria-label="Open Sidebar Navigation"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-extrabold text-primary truncate">
                  Welcome, {user?.name || 'Shopkeeper'}
                </p>
                <h2 className="text-lg sm:text-2xl font-black text-text truncate">
                  {location.pathname === '/dashboard' ? 'Command Center' : 
                   links.find(l => l.to === location.pathname)?.label || 'Inventory Pro'}
                </h2>
              </div>
            </div>

            {/* Right Alerts & Theme Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-text hover:border-primary transition shadow-xs active:scale-95"
              >
                {theme === 'dark' ? <Sun size={18} className="text-warning animate-spin-slow" /> : <Moon size={18} className="text-primary" />}
              </button>

              <NavLink
                to="/notifications"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-2 hover:border-primary transition shadow-xs"
              >
                <div className="relative">
                  <ShoppingCart size={18} className="text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger animate-ping" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">System Alerts</p>
                  <p className="text-xs font-black text-text">
                    {unreadCount} unread
                  </p>
                </div>
              </NavLink>
            </div>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;