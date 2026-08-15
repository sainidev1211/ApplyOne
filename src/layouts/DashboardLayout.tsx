import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { useTheme } from '@/design-system/ThemeProvider';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/shared/Logo';

export function DashboardLayout() {
  const { user, profile, signOut } = useAuthStore();
  const { isDark, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, notificationsOpen]);
  
  // Mock notifications array
  const [mockNotifications, setMockNotifications] = useState([
    {
      id: '1',
      title: 'Welcome to ApplyOne!',
      description: 'Your startup frontend foundation database synchronization is configured cleanly.',
      time: '2m ago',
      unread: true,
    },
    {
      id: '2',
      title: 'Resume Parse Complete',
      description: 'Resume structure parsed successfully. ATS suitability score checks finished at 92%.',
      time: '1h ago',
      unread: true,
    },
    {
      id: '3',
      title: 'Theme Config Sync',
      description: 'Local storage settings synchronized with your preference for light/dark templates.',
      time: '3h ago',
      unread: false,
    },
  ]);

  const unreadCount = mockNotifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setMockNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isProfessionalTier = profile?.account_type === 'Student' || !profile?.account_type;

  const sidebarLinks = [
    { label: 'Home Page', href: ROUTES.HOME, icon: '🏠' },
    ...(profile?.role?.toUpperCase() === 'ADMIN'
      ? [{ label: 'Admin Panel', href: ROUTES.ADMIN, icon: '👮' }]
      : []),
    { label: 'Applications', href: ROUTES.DASHBOARD, icon: '💼' },
    { 
      label: 'ATS Score Checker', 
      href: ROUTES.ATS_CHECKER, 
      icon: '📊', 
      badge: isProfessionalTier ? '🔒' : null 
    },
    { label: 'AI Resume (Soon)', href: '#', icon: '✨', disabled: true },
    { label: 'Subscriptions', href: ROUTES.SUBSCRIPTIONS, icon: '💳' },
    { label: 'Settings', href: ROUTES.SETTINGS, icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-bg-light dark:bg-bg-dark overflow-hidden transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border-light dark:border-border-dark bg-white dark:bg-card-dark transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-border-light dark:border-border-dark">
          <Link to={ROUTES.HOME}>
            <Logo textClass="text-lg" />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto text-left">
          {sidebarLinks.map((link) => (
            <Link
              key={link.label}
              to={link.disabled ? '#' : link.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                link.disabled
                  ? 'opacity-50 cursor-not-allowed text-slate-400'
                  : location.pathname === link.href
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-primary dark:text-blue-400'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-xs" title="Upgrade to unlock">{link.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* User profile section in Sidebar */}
        <div className="p-4 border-t border-border-light dark:border-border-dark space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-sm">
              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                {profile?.full_name || 'Candidate'}
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                {profile?.account_type || 'Account'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border-light dark:border-border-dark bg-white dark:bg-card-dark flex items-center justify-between px-6 transition-colors duration-300">
          <div className="flex items-center space-x-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              📊
            </button>
            <span className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">ApplyOne</span>
          </div>

          <div className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hidden md:block">
            Welcome back, <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{profile?.full_name || 'Candidate'}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle color theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Notification Menu */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative"
                aria-label="Toggle notifications menu"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-card-dark animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-border-light dark:divide-border-dark/60">
                      {mockNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3.5 text-left text-xs transition-colors hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark ${
                            notif.unread ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`font-semibold ${notif.unread ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1 leading-relaxed">
                            {notif.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar / Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none cursor-pointer"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-sm flex-shrink-0">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-lg py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
                      <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                        {profile?.full_name || 'My Profile'}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                        {user?.email || 'user@applyone.com'}
                      </p>
                    </div>
                    <Link
                      to={ROUTES.SUBSCRIPTIONS}
                      onClick={() => setDropdownOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark"
                    >
                      Subscriptions
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Scroll view */}
        <main className="flex-1 overflow-y-auto bg-bg-alt-light dark:bg-bg-alt-dark p-6 transition-colors duration-300">
          <Container clean>
            <Outlet />
          </Container>
        </main>
      </div>

      {/* Drawer Overlay for Mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          
          <aside className="relative flex flex-col w-64 bg-white dark:bg-card-dark h-full border-r border-border-light dark:border-border-dark p-4 space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">ApplyOne Menu</span>
              <button className="text-lg cursor-pointer" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <nav className="flex-1 space-y-2 text-left">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.disabled ? '#' : link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    link.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : location.pathname === link.href
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-primary dark:text-blue-400'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-xs" title="Upgrade to unlock">{link.badge}</span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="pt-4 border-t border-border-light dark:border-border-dark space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium cursor-pointer"
              >
                <span>Sign out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
