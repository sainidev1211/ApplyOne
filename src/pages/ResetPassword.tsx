import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema, ResetPasswordInput } from '@/utils/validation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';

export default function ResetPassword() {
  const { resetPassword, loading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error('Invalid or missing password reset token. Please request a new link.', 'Missing Token');
      return;
    }

    const res = await resetPassword(token, data.password);

    if (res.success) {
      toast.success('Your password has been reset successfully. Please sign in.', 'Password Updated');
      navigate(ROUTES.LOGIN, { replace: true });
    } else {
      toast.error(res.error || 'Failed to reset password. Please request a new recovery link.', 'Action Failed');
    }
  };

  return (
    <>
      <SEO title="Choose a New Password" description="Create a secure new password for your ApplyOne account." />
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Choose a New Password
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Create a secure password containing uppercase, numbers, and symbols.
          </p>
        </div>

        {!token ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-left space-y-3">
            <p className="text-sm font-medium text-red-500">
              Missing Reset Token
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              This password reset link is invalid or incomplete. Please request a new link from the forgot password page.
            </p>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="inline-block text-xs font-semibold text-primary hover:underline"
            >
              Go to Forgot Password →
            </Link>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              id="password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              id="confirmPassword"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" variant="gradient" className="w-full h-11" loading={loading}>
              Save Password & Log In
            </Button>
          </form>
        )}

        <div className="text-center text-sm">
          <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </>
  );
}
