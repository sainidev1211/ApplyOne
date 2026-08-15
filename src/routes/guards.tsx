import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { LoadingSpinner } from '@/components/ui/States';

/**
 * Protects routes from unauthenticated users.
 * Redirects to login and saves the source path for redirects post-login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

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
  allowedRoles: string[];
}) {
  const { profile, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors duration-300">
        <LoadingSpinner label="Verifying access permissions..." />
      </div>
    );
  }

  const userRole = profile?.role?.toUpperCase();
  const isAllowed = allowedRoles.map((r) => r.toUpperCase()).includes(userRole || '');

  if (!profile || !isAllowed) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
