import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/utils/validation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function ForgotPassword() {
  const { sendPasswordReset, loading } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const [isGoogleOnly, setIsGoogleOnly] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    const res = await sendPasswordReset(data.email);

    if (res.success) {
      setSubmitted(true);
      setIsGoogleOnly(Boolean(res.isGoogleOnly));
      toast.success(res.message || 'Recovery instructions processed.', 'Request Submitted');
      reset();
    } else {
      toast.error(res.error || 'Could not process reset request. Please check your email.', 'Action Failed');
    }
  };

  return (
    <>
      <SEO title="Forgot Password" description="Request a secure password reset link for your ApplyOne account." />
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Reset Password
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Enter your email and we'll send a password recovery link.
          </p>
        </div>

        {isGoogleOnly && submitted ? (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-left space-y-3">
            <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              Google Account Detected
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              This account was created with Google Sign-In and does not have a separate password. You can sign in instantly with Google below:
            </p>
            <GoogleAuthButton buttonText="Sign In with Google" />
          </div>
        ) : submitted ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2">
            <p className="text-sm font-medium text-emerald-600 dark:emerald-400">
              Check Your Inbox
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              If an account with that email exists, we've sent a secure recovery link. The link expires in 1 hour.
            </p>
          </div>
        ) : null}

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            id="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" variant="gradient" className="w-full h-11" loading={loading}>
            Send Recovery Link
          </Button>
        </form>

        {/* Back Link */}
        <div className="text-center text-sm">
          <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </>
  );
}
