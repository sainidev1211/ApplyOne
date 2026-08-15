import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/States';
import { useAuthStore } from '@/store/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, initializeAuth } = useAuthStore();

  useEffect(() => {
    const processAuth = async () => {
      // Google OAuth removed — restore any stored session using standard flow
      await initializeAuth();
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [navigate, initializeAuth, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors duration-300 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <LoadingSpinner label="Restoring your authenticated session..." />
      </div>
    </div>
  );
};

export default AuthCallback;
