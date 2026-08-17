import {
  BarChart3,
  BellRing,
  Boxes,
  Home,
  LogOut,
  Settings,
  TriangleAlert,
  Menu,
  ReceiptText,
  Users,
  Wallet,
  Sun,
  Moon,
  X,
  Building2,
  Truck,
} from 'lucide-react';

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../hooks/useScrollLock';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Home, inBottomBar: true },
  { to: '/invoices', label: 'Billing / Invoices', icon: ReceiptText, inBottomBar: true },
  { to: '/customers', label: 'Customer Ledger', icon: Users },
  { to: '/suppliers', label: 'Supplier Ledger', icon: Truck },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/expenses', label: 'Expenses', icon: Wallet, inBottomBar: true },
  { to: '/out-of-stock', label: 'Out of Stock', icon: TriangleAlert },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/business-profile', label: 'Shop Profiles', icon: Building2 },
  { to: '/notifications', label: 'Notifications', icon: BellRing },
  { to: '/profile', label: 'Account Profile', icon: Settings, inBottomBar: true },
];

const Layout = () => {
  const { user, logout, notifications, theme, toggleTheme } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  useScrollLock(sidebarOpen);
  
  // Scroll detection for Bottom Bar
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
          {links.map(({ to, label, icon: Icon, inBottomBar }) => {
            const active = location.pathname === to;
            
            // Hide bottom bar items in mobile sidebar to avoid duplication
            const hiddenOnMobile = inBottomBar ? 'hidden lg:flex' : 'flex';

            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`group ${hiddenOnMobile} items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
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
        <header className="fixed top-0 left-0 right-0 lg:left-72 z-30 border-b border-border bg-surface/85 px-3 py-2.5 sm:px-6 lg:px-8 backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 sm:p-2.5 rounded-xl border border-border bg-background text-text hover:bg-surface transition shrink-0 shadow-xs"
                aria-label="Open Sidebar Navigation"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[9px] sm:text-xs uppercase tracking-widest sm:tracking-[0.25em] font-extrabold text-primary truncate">
                  Welcome, {user?.name?.split(' ')[0] || 'User'}
                </p>
                <h2 className="text-sm sm:text-2xl font-black text-text truncate">
                  {location.pathname === '/dashboard' ? 'Command Center' : 
                   links.find(l => l.to === location.pathname)?.label || 'Inventory Pro'}
                </h2>
              </div>
            </div>

            {/* Right Alerts & Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-border bg-background text-text hover:border-primary transition shadow-xs active:scale-95 shrink-0"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-warning animate-spin-slow" /> : <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-primary" />}
              </button>

              <NavLink
                to="/notifications"
                className="flex items-center gap-2 sm:gap-2.5 rounded-xl border border-border bg-background px-2.5 py-1.5 sm:px-3.5 sm:py-2 hover:border-primary transition shadow-xs shrink-0"
              >
                <div className="relative flex items-center justify-center">
                  <BellRing className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger animate-pulse border border-background" />
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
        <main className="flex-1 p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24 pb-24 lg:pb-8 relative">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ================= BOTTOM BAR (MOBILE ONLY) ================= */}
      <div 
        className={`
          lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.2)]
          transition-transform duration-300 ease-in-out px-2 py-1.5 flex items-center justify-around
          ${isScrollingDown ? 'translate-y-full' : 'translate-y-0'}
        `}
      >
        {links.filter(l => l.inBottomBar).map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px] transition-all duration-200 ${
                active ? 'text-primary' : 'text-text-muted hover:text-text hover:bg-background'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-primary/10' : ''}`}>
                <Icon size={20} className={active ? 'fill-primary/20' : ''} />
              </div>
              <span className={`text-[10px] font-bold ${active ? 'text-primary' : ''}`}>
                {label.split(' ')[0]}
              </span>
            </NavLink>
          );
        })}
      </div>

    </div>
  );
};

export default Layout;