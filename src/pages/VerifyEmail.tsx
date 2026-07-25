import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';

export default function VerifyEmail() {
  const { resendVerification } = useAuthStore();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  
  // Retrieve email from routing state
  const email = (location.state as any)?.email || 'your email address';

  const handleResend = async () => {
    if (!email || email === 'your email address') {
      toast.error('Please return to sign in or sign up to verify email.', 'Missing Email');
      return;
    }

    setResending(true);
    const res = await resendVerification(email);
    setResending(false);

    if (res.success) {
      toast.success(res.message || 'Verification link resent to your email.', 'Link Resent');
    } else {
      toast.error('Could not resend email. Please try again later.', 'Action Failed');
    }
  };

  return (
    <>
      <SEO title="Verify Email" description="Verify your email address to activate your ApplyOne candidate account." />
      <div className="space-y-6 text-center">
        {/* Envelope Icon */}
        <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-3xl">
          ✉️
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Confirm Your Email
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            We have sent a confirmation link to:
          </p>
          <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-bg-alt-light dark:bg-bg-alt-dark/80 p-4 rounded-xl border border-border-light dark:border-border-dark text-xs text-left space-y-2 leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
          <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
            Why is verification required?
          </p>
          <p>
            To maintain security and protect candidate applications, ApplyOne requires all accounts to verify ownership of their email. You cannot sign in until you click the confirmation link in the email.
          </p>
          <p>
            The link is valid for 24 hours. If it expires or you encounter issues, you can request a new link below.
          </p>
        </div>

        {/* Resend Action */}
        <div className="space-y-3">
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            loading={resending}
          >
            Resend Verification Link
          </Button>

          <Link to={ROUTES.LOGIN} className="block">
            <Button variant="ghost" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
