import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/design-system/ThemeProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from '@/components/ui/Toast';
import { AIChatbox } from '@/components/shared/AIChatbox';
import { useAuthStore } from '@/store/authStore';
import { loggingService } from '@/services/logging/loggingService';

export function App() {
  const { initializeAuth } = useAuthStore();

  // Initialize session and authentication bindings on mount
  useEffect(() => {
    loggingService.info('[APP]: Bootstrapping application credentials');
    initializeAuth();
  }, [initializeAuth]);

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
