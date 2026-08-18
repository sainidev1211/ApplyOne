import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/utils/validation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function Login() {
  const { signIn, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ email, password }: LoginInput) => {
    const result = await signIn(email, password);
    if (result.success) {
      toast.success('Welcome back!', 'Signed in');
      if (result.needsProfileCompletion) {
        navigate(ROUTES.COMPLETE_PROFILE || '/complete-profile', { replace: true });
      } else {
        navigate((location.state as any)?.from?.pathname || ROUTES.DASHBOARD, { replace: true });
      }
    } else {
      toast.error(result.error || 'Invalid email or password.', 'Sign in failed');
    }
  };

  return (
    <>
      <SEO title="Sign In" description="Sign in to your ApplyOne account." />
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">Welcome to ApplyOne</h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sign in to manage your job applications.</p>
        </div>

        {/* Email & Password Form FIRST */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end pt-1">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full h-11" loading={loading}>
            Sign In
          </Button>
        </form>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-border-light dark:border-border-dark w-full" />
          <span className="bg-white dark:bg-card-dark px-3 text-xs uppercase text-text-secondary-light dark:text-text-secondary-dark font-semibold tracking-wider">
            OR
          </span>
          <div className="border-t border-border-light dark:border-border-dark w-full" />
        </div>

        {/* Google Authentication */}
        <GoogleAuthButton buttonText="Continue with Google" />

        {/* Sign up Link */}
        <div className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark pt-2">
          Don't have an account?{' '}
          <Link to={ROUTES.SIGNUP} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </>
  );
}
