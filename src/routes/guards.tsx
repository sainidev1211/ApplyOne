import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES, UserRole } from '@/config/appConfig';
import { LoadingSpinner } from '@/components/ui/States';

/**
 * Protects routes from unauthenticated users.
 * Redirects to login and saves the source path for redirects post-login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  // Show a loading screen while auth state is initializing from Supabase
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors duration-300">
        <LoadingSpinner label="Securing session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Mandatory email verification check. If the user object exists but lacks confirmation
  if (user.id !== 'pending-verify' && !user.email_confirmed_at) {
    // If running in real mode and not verified, force verify screen
    const isSimulation =
      !import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL.includes('placeholder');
    
    if (!isSimulation) {
      return <Navigate to={ROUTES.VERIFY_EMAIL} replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Restricts route access to specific user roles.
 */
export function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { profile, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors duration-300">
        <LoadingSpinner label="Verifying access permissions..." />
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Fall back to dashboard if role is unauthorized
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
