import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/design-system/ThemeProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from '@/components/ui/Toast';
import { AIChatbox } from '@/components/shared/AIChatbox';
import { useAuthStore } from '@/store/authStore';
import { loggingService } from '@/services/logging/loggingService';

export function App() {
  const { initializeAuth, signOut, user } = useAuthStore();

  // Initialize session and authentication bindings on mount
  useEffect(() => {
    loggingService.info('[APP]: Bootstrapping application credentials');
    initializeAuth();
  }, [initializeAuth]);

  // Auto-logout after 1 hour (3,600,000 ms) of tab inactivity / background tab
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour
    let hiddenTimestamp: number | null = null;
    let timer: any = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        signOut();
      }, INACTIVITY_LIMIT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimestamp = Date.now();
      } else {
        if (hiddenTimestamp && Date.now() - hiddenTimestamp >= INACTIVITY_LIMIT_MS) {
          signOut();
        } else {
          resetTimer();
        }
        hiddenTimestamp = null;
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!document.hidden) {
        resetTimer();
      }
    };

    resetTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [user, signOut]);

  return (
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-300">
          <AppRoutes />
          <Toaster />
          <AIChatbox />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
