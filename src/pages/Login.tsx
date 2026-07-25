import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, LoginInput } from '@/utils/validation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';

export default function Login() {
  const { signIn, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Find redirect path after login
  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    const res = await signIn(data.email, data.password);

    if (res.success) {
      toast.success('Successfully logged in.', 'Welcome Back');
      navigate(from, { replace: true });
    } else if (res.isUnverified) {
      toast.warning('Please confirm your email address before logging in.', 'Email Unverified');
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: data.email } });
    } else {
      toast.error(res.error || 'Please check your credentials and try again.', 'Authentication Failed');
    }
  };

  return (
    <>
      <SEO title="Sign In" description="Sign in to your ApplyOne candidate account." />
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Welcome Back
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Enter your credentials to manage your job applications.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            id="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark"
              >
                Password
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              id="password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button type="submit" variant="gradient" className="w-full h-11" loading={loading}>
            Sign In
          </Button>
        </form>

        {/* Register link */}
        <div className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Don't have an account?{' '}
          <Link to={ROUTES.SIGNUP} className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}
