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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../hooks/useScrollLock';
import LoadingScreen from './LoadingScreen';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useScrollLock(sidebarOpen);
  
  // Page transition loading state
  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
          fixed left-0 top-0 z-50 flex flex-col h-screen border-r border-border
          bg-surface shadow-2xl transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20 w-72' : 'w-72'}
        `}
      >
        {/* Header Section */}
        <div className={`shrink-0 p-5 pb-4 border-b border-border flex items-center ${sidebarCollapsed ? 'lg:justify-center lg:px-2 justify-between' : 'justify-between'}`}>
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
            <p className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-primary">
              Inventory Pro
            </p>
            <h1 className="mt-1 text-lg font-black tracking-tight text-text">
              Shopkeeper Suite
            </h1>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className={`shrink-0 mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3.5 shadow-xs transition-all duration-300 ${sidebarCollapsed ? 'mx-2 lg:justify-center' : 'mx-4'}`}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-11 w-11 rounded-xl object-cover border-2 border-primary shrink-0" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-tr from-cyan-500 to-blue-600 font-bold text-white shrink-0 shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
          <div className={`min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100 flex-1'}`}>
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
                className={`group ${hiddenOnMobile} relative flex items-center rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
                  sidebarCollapsed ? 'lg:justify-center px-3.5' : 'px-3.5'
                } ${
                  active
                    ? 'bg-primary text-slate-950 shadow-md shadow-primary/20 font-bold'
                    : 'text-text-muted hover:bg-background hover:text-text'
                }`}
                title={sidebarCollapsed ? label : ''}
              >
                <div className="flex items-center">
                  <Icon
                    size={18}
                    className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${active ? 'text-slate-950' : 'text-primary'}`}
                  />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>{label}</span>
                </div>
                {to === '/notifications' && unreadCount > 0 && (
                  <>
                    <div className={`ml-auto transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[40px] opacity-100'}`}>
                      <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-slate-950 text-white' : 'bg-danger text-white animate-pulse'
                      }`}>
                        {unreadCount}
                      </span>
                    </div>
                    {sidebarCollapsed && (
                      <span className="hidden lg:block absolute top-2 right-2 h-2 w-2 rounded-full bg-danger animate-pulse border border-background" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Fixed Logout Button at Bottom */}
        <div className="shrink-0 p-4 border-t border-border bg-surface">
          <button
            onClick={logout}
            className={`flex w-full items-center justify-center rounded-xl border border-danger/30 bg-danger/10 py-3 text-sm font-bold text-danger transition-all duration-300 hover:bg-danger hover:text-white shadow-xs active:scale-[0.98] ${
              sidebarCollapsed ? 'lg:px-0 px-4' : 'px-4'
            }`}
            title={sidebarCollapsed ? 'Sign Out' : ''}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-2'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className={`flex flex-1 flex-col min-h-screen overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        
        {/* ================= TOPBAR ================= */}
        <header className={`mobile-force-dark fixed top-0 left-0 right-0 z-30 border-b border-border bg-background/95 px-3 py-2.5 sm:px-6 lg:px-8 backdrop-blur-xl transition-transform duration-300 shadow-sm ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'} ${isScrollingDown ? '-translate-y-full' : 'translate-y-0'}`}>
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
              {isPageLoading ? (
                <motion.div
                  key="page-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoadingScreen fullScreen={false} message="Loading..." />
                </motion.div>
              ) : (
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ================= BOTTOM BAR (MOBILE ONLY) ================= */}
      <div 
        className={`
          mobile-force-dark lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-background/95 backdrop-blur-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)]
          transition-transform duration-300 ease-in-out px-2 py-1.5 flex items-center justify-between rounded-[2rem] mx-auto max-w-md
          ${isScrollingDown ? 'translate-y-[calc(100%+24px)]' : 'translate-y-0'}
        `}
      >
        {links.filter(l => l.inBottomBar).map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 px-1 rounded-full min-w-0 transition-all duration-200 ${
                active ? 'text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              <div className={`p-1 rounded-full transition-all duration-200 ${active ? 'bg-primary/10 scale-110' : ''}`}>
                <Icon size={16} className={active ? 'fill-primary/20' : ''} />
              </div>
              <span className={`text-[9px] font-bold truncate w-full text-center px-1 ${active ? 'text-primary' : ''}`}>
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