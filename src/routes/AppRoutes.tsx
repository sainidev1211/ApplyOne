import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute, RoleGuard } from './guards';
import { LoadingSpinner } from '@/components/ui/States';

// Lazy load pages for chunk optimizations
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Subscriptions = lazy(() => import('@/pages/Subscriptions'));
const AtsChecker = lazy(() => import('@/pages/AtsChecker'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const AdminLogin = lazy(() => import('@/features/admin/AdminLogin'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors duration-300">
          <LoadingSpinner label="Loading application modules..." />
        </div>
      }
    >
      <Routes>
        {/* Marketing Layout Wrapper */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Route>

        {/* Authentication Card Layout Wrapper */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Route>

        {/* Secret Admin Authentication */}
        <Route path="/portal-access/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Dashboard Shell Wrapper locked behind Protected Guard */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/subscriptions" element={<Subscriptions />} />
          <Route path="/dashboard/ats-checker" element={<AtsChecker />} />
          <Route path="/dashboard/settings" element={<Settings />} />
        </Route>

        {/* Executive Admin Management Portal */}
        <Route
          path="/portal-access"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <AdminPanel />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <AdminPanel />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Wildcard redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
export default AppRoutes;
