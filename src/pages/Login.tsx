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
import { authClient } from '@/services/authClient';

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
      navigate((location.state as any)?.from?.pathname || ROUTES.DASHBOARD, { replace: true });
    } else {
      toast.error(result.error || 'Invalid email or password.', 'Sign in failed');
    }
  };

  return (
    <>
      <SEO title="Sign In" description="Sign in to your ApplyOne account." />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">Welcome to ApplyOne</h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sign in with your email and password.</p>
        </div>
        <div className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          <Button type="submit" className="w-full" loading={loading}>Sign In</Button>
        </div>
        {/* Google login removed */}
        <div className="flex justify-between text-sm">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">Forgot password?</Link>
          <Link to={ROUTES.SIGNUP} className="text-primary hover:underline">Create an account</Link>
        </div>
      </form>
    </>
  );
}
