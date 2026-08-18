import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { ROUTES } from '@/config/appConfig';

interface GoogleAuthButtonProps {
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleAuthButton({
  buttonText = 'Continue with Google',
  className = '',
  disabled = false,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const { signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '556193394201-uum65mim769ejqprjvnst5kocacn0brb.apps.googleusercontent.com';

  const handleCredentialResponse = async (response: { credential: string }) => {
    if (!response.credential) {
      toast.error('Did not receive credentials from Google.', 'Sign In Error');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithGoogle(response.credential);
      if (result.success) {
        toast.success(result.message || 'Authenticated successfully.', 'Welcome');
        if (result.needsProfileCompletion) {
          navigate(ROUTES.COMPLETE_PROFILE || '/complete-profile', { replace: true });
        } else {
          const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;
          navigate(from, { replace: true });
        }
      } else {
        toast.error(result.error || 'Google sign-in failed. Please try again.', 'Authentication Failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred during Google sign-in.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if script already exists
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'google-identity-services-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Identity Services SDK.');
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', () => setScriptLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !googleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render GIS button in container for native fallback triggers if clicked
      if (googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: '100%',
        });
      }
    } catch (err) {
      console.warn('Google Identity initialization notice:', err);
    }
  }, [scriptLoaded, googleClientId]);

  const handleCustomButtonClick = () => {
    if (loading || disabled) return;

    if (window.google?.accounts?.id) {
      const iframeOrBtn = googleBtnContainerRef.current?.querySelector('div[role="button"]') as HTMLElement | null;
      if (iframeOrBtn) {
        iframeOrBtn.click();
        return;
      }
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const renderedBtn = googleBtnContainerRef.current?.querySelector('div[role="button"]') as HTMLElement | null;
          if (renderedBtn) renderedBtn.click();
        }
      });
    } else {
      toast.error('Google Sign-In is still loading. Please check your internet connection and try again.', 'Please Wait');
    }
  };

  return (
    <div className="w-full relative">
      {/* Hidden GIS native button container that will catch click events or render invisible */}
      <div
        ref={googleBtnContainerRef}
        className="hidden"
        style={{ display: 'none' }}
        title={buttonText}
      />

      <button
        type="button"
        onClick={handleCustomButtonClick}
        disabled={disabled || loading}
        className={`w-full relative flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${className}`}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>{buttonText}</span>
      </button>
    </div>
  );
}
