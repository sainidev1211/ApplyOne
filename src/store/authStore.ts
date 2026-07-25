import { create } from 'zustand';
import { authService } from '@/services/supabase/authService';
import { profileService } from '@/services/supabase/profileService';
import { supabase } from '@/services/supabase/client';
import { UserProfile, AuthSession } from '@/types/auth';
import { AccountType } from '@/config/appConfig';
import { loggingService } from '@/services/logging/loggingService';

interface AuthState {
  user: AuthSession['user'] | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  signUp: (
    email: string,
    password: string,
    metadata: Record<string, any>
  ) => Promise<{ success: boolean; message: string; error?: string }>;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; isUnverified?: boolean; error?: string }>;

  signOut: () => Promise<void>;

  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;

  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;

  resetPassword: (password: string) => Promise<{ success: boolean; message: string }>;

  updateProfile: (
    profileData: Partial<UserProfile>
  ) => Promise<{ success: boolean; message: string; error?: string }>;

  initializeAuth: () => Promise<void>;
  
  clearError: () => void;
}

const isSimulation =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,

  clearError: () => set({ error: null }),

  signUp: async (email, password, metadata) => {
    set({ loading: true, error: null });
    const response = await authService.signUp(email, password, metadata);
    
    if (response.success && response.data) {
      set({ loading: false });
      // Note: In Supabase, the user has to verify their email first, so we do not log them in directly
      if (isSimulation) {
        // In simulation mode, store unverified session in state for verify-email screen
        set({ user: response.data.user });
      }
      return { success: true, message: response.message || 'Verification email sent.' };
    } else {
      set({ loading: false, error: response.error });
      return { success: false, message: response.message || 'Signup failed.', error: response.error || undefined };
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const response = await authService.signIn(email, password);

    if (response.success && response.data) {
      const user = response.data.user;
      const session = response.data.session;

      // Fetch profile
      if (user) {
        const profileResp = await profileService.getProfile(user.id);
        if (profileResp.success && profileResp.data) {
          set({
            user,
            session,
            profile: profileResp.data,
            loading: false,
          });

          if (isSimulation) {
            localStorage.setItem('applyone_session_user', JSON.stringify(user));
            localStorage.setItem('applyone_session_token', 'mock-session-token');
          }
          return { success: true, message: 'Welcome back!' };
        } else {
          set({ loading: false, error: 'Could not retrieve user profile.' });
          return { success: false, message: 'Failed to retrieve profile.' };
        }
      }
      set({ loading: false });
      return { success: false, message: 'Invalid session structure.' };
    } else {
      set({ loading: false });
      if (response.error === 'EMAIL_NOT_VERIFIED') {
        // Email is not verified
        set({ user: response.data?.user || { id: 'pending-verify', email } });
        return { success: false, message: response.message || 'Email not verified.', isUnverified: true };
      }
      set({ error: response.error });
      return { success: false, message: response.message || 'Login failed.', error: response.error || undefined };
    }
  },

  signOut: async () => {
    set({ loading: true });
    await authService.signOut();
    
    if (isSimulation) {
      localStorage.removeItem('applyone_session_user');
      localStorage.removeItem('applyone_session_token');
    }

    set({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null,
    });
  },

  resendVerification: async (email) => {
    const res = await authService.resendVerificationEmail(email);
    return { success: res.success, message: res.message || '' };
  },

  sendPasswordReset: async (email) => {
    set({ loading: true, error: null });
    const res = await authService.sendPasswordResetEmail(email);
    set({ loading: false });
    return { success: res.success, message: res.message || '' };
  },

  resetPassword: async (password) => {
    set({ loading: true, error: null });
    const res = await authService.updatePassword(password);
    set({ loading: false });
    return { success: res.success, message: res.message || '' };
  },

  updateProfile: async (profileData) => {
    const user = get().user;
    if (!user) {
      return { success: false, message: 'No user session active.' };
    }
    set({ loading: true, error: null });
    const response = await profileService.updateProfile({ id: user.id, ...profileData });
    if (response.success && response.data) {
      set({ profile: response.data, loading: false });
      return { success: true, message: response.message || 'Profile updated successfully.' };
    } else {
      set({ loading: false, error: response.error });
      return { success: false, message: response.message || 'Update failed.', error: response.error || undefined };
    }
  },

  initializeAuth: async () => {
    if (get().initialized) return;

    set({ loading: true });

    if (isSimulation) {
      const storedUser = localStorage.getItem('applyone_session_user');
      const storedToken = localStorage.getItem('applyone_session_token');

      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser) as AuthSession['user'];
        const profileResp = await profileService.getProfile(user!.id);

        if (profileResp.success && profileResp.data) {
          set({
            user,
            session: { access_token: storedToken },
            profile: profileResp.data,
            initialized: true,
            loading: false,
          });
          loggingService.info('[AUTH]: Simulated session restored.');
          return;
        }
      }
      set({ initialized: true, loading: false });
      return;
    }

    // Real Supabase Session initialization
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        const user = {
          id: session.user.id,
          email: session.user.email || '',
          email_confirmed_at: session.user.email_confirmed_at,
        };

        if (user.email_confirmed_at) {
          const profileResp = await profileService.getProfile(user.id);
          if (profileResp.success && profileResp.data) {
            set({
              user,
              session,
              profile: profileResp.data,
            });
          }
        }
      }

      // Subscribe to real-time auth changes
      supabase.auth.onAuthStateChange(async (event, currentSession) => {
        loggingService.log(`[AUTH]: Auth state changed event: ${event}`);

        if (currentSession && currentSession.user) {
          const u = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            email_confirmed_at: currentSession.user.email_confirmed_at,
          };

          if (u.email_confirmed_at) {
            const profileResp = await profileService.getProfile(u.id);
            if (profileResp.success && profileResp.data) {
              set({
                user: u,
                session: currentSession,
                profile: profileResp.data,
              });
            }
          } else {
            // User logged in but not confirmed? Typically Supabase handles this, but let's clear it
            set({ user: null, session: null, profile: null });
          }
        } else {
          set({ user: null, session: null, profile: null });
        }
      });
    } catch (err) {
      loggingService.error('Error initializing real auth', err as Error);
    } finally {
      set({ initialized: true, loading: false });
    }
  },
}));
