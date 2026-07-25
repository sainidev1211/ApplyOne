import { supabase } from './client';
import { IAuthService, AuthSession } from '@/types/auth';
import { ServiceResponse } from '@/types/services';
import { AccountType } from '@/config/appConfig';
import { loggingService } from '../logging/loggingService';

// Decide if we should run in simulation mode based on env vars
const isSimulation =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

class SupabaseAuthService implements IAuthService {
  async signUp(
    email: string,
    password: string,
    metadata: Record<string, any>
  ): Promise<ServiceResponse<AuthSession>> {
    try {
      loggingService.info(`[AUTH]: Registering user: ${email}`);

      if (isSimulation) {
        // Simulation Mode
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Simulating the user object
        const mockUser = {
          id: 'simulated-uuid-1234-5678',
          email,
          email_confirmed_at: undefined, // Email is NOT verified initially
        };

        // Save mock profile in localStorage for local persistence
        const mockProfile = {
          id: mockUser.id,
          email,
          full_name: metadata.full_name || 'Google Candidate',
          phone: metadata.phone || null,
          account_type: metadata.account_type || 'Student',
          role: 'Student',
          resume_url: metadata.resume_url || null,
          has_experience: metadata.has_experience || false,
          company_name: metadata.company_name || null,
          role_details: metadata.role_details || null,
          employment_types: metadata.employment_types || [],
          last_monthly_package: metadata.last_monthly_package || null,
          expected_packages: metadata.expected_packages || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(`applyone_profile_${mockUser.id}`, JSON.stringify(mockProfile));

        return {
          success: true,
          data: {
            user: mockUser,
            session: { access_token: 'mock-session-token' },
          },
          error: null,
          message: 'Registration successful! Verification email sent.',
        };
      }

      // Real Supabase Mode
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            role: 'Student', // Default role for users
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email || '',
            email_confirmed_at: data.user.email_confirmed_at,
          } : null,
          session: data.session,
        },
        error: null,
        message: 'Signup successful! Please check your email for the verification link.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'An error occurred during sign up.',
        message: 'Registration failed.',
      };
    }
  }

  async signIn(email: string, password: string): Promise<ServiceResponse<AuthSession>> {
    try {
      loggingService.info(`[AUTH]: Signing in user: ${email}`);

      if (isSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 800));

        // If password is 'verified', let them log in directly. Otherwise simulate unverified check.
        // Also if email is 'verified@applyone.com', skip verification check
        const isVerified = email === 'verified@applyone.com' || password === 'verified123';

        const mockUser = {
          id: 'simulated-uuid-1234-5678',
          email,
          email_confirmed_at: isVerified ? new Date().toISOString() : undefined,
        };

        if (!isVerified) {
          return {
            success: false,
            data: { user: mockUser, session: null },
            error: 'EMAIL_NOT_VERIFIED',
            message: 'Your email address is not verified yet. Please check your inbox.',
          };
        }

        return {
          success: true,
          data: {
            user: mockUser,
            session: { access_token: 'mock-session-token' },
          },
          error: null,
          message: 'Sign in successful.',
        };
      }

      // Real Supabase Mode
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if email confirmation is required and if they are confirmed
      if (data.user && !data.user.email_confirmed_at) {
        return {
          success: false,
          data: {
            user: {
              id: data.user.id,
              email: data.user.email || '',
              email_confirmed_at: undefined,
            },
            session: null,
          },
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before logging in.',
        };
      }

      return {
        success: true,
        data: {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email || '',
            email_confirmed_at: data.user.email_confirmed_at,
          } : null,
          session: data.session,
        },
        error: null,
        message: 'Sign in successful.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'An error occurred during sign in.',
        message: 'Sign in failed.',
      };
    }
  }

  async signOut(): Promise<ServiceResponse<void>> {
    try {
      loggingService.info('[AUTH]: Logging out');

      if (isSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          success: true,
          data: null,
          error: null,
          message: 'Logged out successfully.',
        };
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        data: null,
        error: null,
        message: 'Logged out successfully.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'An error occurred during sign out.',
        message: 'Sign out failed.',
      };
    }
  }

  async getCurrentUser(): Promise<ServiceResponse<AuthSession['user']>> {
    try {
      if (isSimulation) {
        return {
          success: true,
          data: null, // Zustand or router session will handle simulated current user
          error: null,
          message: 'Retrieved session.',
        };
      }

      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      return {
        success: true,
        data: data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          email_confirmed_at: data.user.email_confirmed_at,
        } : null,
        error: null,
        message: 'User retrieved.',
      };
    } catch (err: any) {
      // Don't log error for empty session as it's common
      return {
        success: false,
        data: null,
        error: err.message,
        message: 'No active session.',
      };
    }
  }

  async resendVerificationEmail(email: string): Promise<ServiceResponse<void>> {
    try {
      loggingService.info(`[AUTH]: Resending verification email to: ${email}`);

      if (isSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
          success: true,
          data: null,
          error: null,
          message: 'Verification link resent to ' + email,
        };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      return {
        success: true,
        data: null,
        error: null,
        message: 'Verification link resent successfully.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to resend verification.',
        message: 'Action failed.',
      };
    }
  }

  async sendPasswordResetEmail(email: string): Promise<ServiceResponse<void>> {
    try {
      loggingService.info(`[AUTH]: Sending reset password email to: ${email}`);

      if (isSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return {
          success: true,
          data: null,
          error: null,
          message: 'Password reset link sent to ' + email,
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        data: null,
        error: null,
        message: 'Password reset email sent.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to send reset email.',
        message: 'Action failed.',
      };
    }
  }

  async updatePassword(password: string): Promise<ServiceResponse<void>> {
    try {
      loggingService.info('[AUTH]: Updating password');

      if (isSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
          success: true,
          data: null,
          error: null,
          message: 'Password updated successfully.',
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      return {
        success: true,
        data: null,
        error: null,
        message: 'Password updated successfully.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to update password.',
        message: 'Update failed.',
      };
    }
  }
}

export const authService: IAuthService = new SupabaseAuthService();
