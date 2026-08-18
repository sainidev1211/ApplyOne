import { create } from 'zustand';
import { authClient, clearStoredSession, getStoredSession, updateStoredUser } from '@/services/authClient';
import { UserProfile, AuthSession } from '@/types/auth';

interface AuthState {
  user: AuthSession['user'] | null;
  profile: UserProfile | null;
  session: AuthSession['session'] | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string; needsProfileCompletion?: boolean; error?: string }>;
  signUp: (formData: FormData) => Promise<{ success: boolean; message: string; needsProfileCompletion?: boolean; error?: string }>;
  signInWithGoogle: (credential: string) => Promise<{ success: boolean; message: string; needsProfileCompletion?: boolean; error?: string }>;
  completeProfile: (formData: FormData) => Promise<{ success: boolean; message: string; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string; isGoogleOnly?: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; message: string; error?: string }>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

function buildProfile(user: any): UserProfile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName || user.email,
    phone: user.phone || null,
    account_type: user.accountType || 'STUDENT',
    role: user.role || 'USER',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function applySession(set: (state: Partial<AuthState>) => void, data: AuthSession, storedUser?: any): void {
  const user = storedUser ?? getStoredSession()?.user ?? data.user;
  set({ user: data.user, session: data.session, profile: buildProfile(user), loading: false, error: null });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,
  clearError: () => set({ error: null }),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const response = await authClient.signIn(email, password);
    if (response.success && response.data) {
      applySession(set, response.data);
      return {
        success: true,
        message: response.message || 'Signed in successfully.',
        needsProfileCompletion: response.data.needsProfileCompletion,
      };
    }
    set({ loading: false, error: response.error });
    return { success: false, message: response.message || 'Sign in failed.', error: response.error ?? undefined };
  },

  signUp: async (formData) => {
    set({ loading: true, error: null });
    const response = await authClient.signUp(formData);
    if (response.success && response.data) {
      applySession(set, response.data);
      return {
        success: true,
        message: response.message || 'Account created successfully.',
        needsProfileCompletion: response.data.needsProfileCompletion,
      };
    }
    set({ loading: false, error: response.error });
    return { success: false, message: response.message || 'Registration failed.', error: response.error ?? undefined };
  },

  signInWithGoogle: async (credential) => {
    set({ loading: true, error: null });
    const response = await authClient.googleAuth(credential);
    if (response.success && response.data) {
      applySession(set, response.data);
      return {
        success: true,
        message: response.message || 'Signed in with Google.',
        needsProfileCompletion: response.data.needsProfileCompletion,
      };
    }
    set({ loading: false, error: response.error });
    return { success: false, message: response.message || 'Google sign in failed.', error: response.error ?? undefined };
  },

  completeProfile: async (formData) => {
    set({ loading: true, error: null });
    const response = await authClient.completeProfile(formData);
    if (response.success && response.data) {
      applySession(set, response.data);
      return { success: true, message: 'Profile completed successfully.' };
    }
    set({ loading: false, error: response.error });
    return { success: false, message: response.message || 'Failed to complete profile.', error: response.error ?? undefined };
  },

  sendPasswordReset: async (email) => {
    set({ loading: true, error: null });
    const response = await authClient.forgotPassword(email);
    set({ loading: false });
    if (response.success) {
      return {
        success: true,
        message: response.message || 'Recovery email sent if account exists.',
        isGoogleOnly: response.data?.isGoogleOnly,
      };
    }
    return {
      success: false,
      message: response.message || 'Could not send recovery email.',
      error: response.error ?? undefined,
    };
  },

  resetPassword: async (token, password) => {
    set({ loading: true, error: null });
    const response = await authClient.resetPassword(token, password);
    set({ loading: false });
    if (response.success) {
      return { success: true, message: response.message || 'Password reset successfully.' };
    }
    return {
      success: false,
      message: response.message || 'Password reset failed.',
      error: response.error ?? undefined,
    };
  },

  resendVerification: async () => ({ success: true, message: 'Email/password accounts are active immediately.' }),

  signOut: async () => {
    clearStoredSession();
    set({ user: null, profile: null, session: null, loading: false, error: null });
  },

  updateProfile: async (profileData) => {
    const profile = get().profile;
    if (!profile) return { success: false, message: 'No active session.' };
    set({ profile: { ...profile, ...profileData } });
    updateStoredUser({
      fullName: profileData.full_name,
      phone: profileData.phone,
      accountType: profileData.account_type,
      bio: (profileData as any).bio,
      linkedinUrl: (profileData as any).linkedinUrl,
      githubUrl: (profileData as any).githubUrl,
    });
    return { success: true, message: 'Profile updated.' };
  },

  initializeAuth: async () => {
    if (get().initialized) return;
    set({ loading: true });
    const response = await authClient.getCurrentUser();
    if (response.success && response.data) {
      const stored = getStoredSession();
      set({
        user: { id: response.data.id, email: response.data.email, email_confirmed_at: new Date().toISOString() },
        profile: buildProfile(response.data),
        session: stored ? { access_token: stored.token, token_type: 'Bearer', expires_in: 604800 } : null,
      });
    }
    set({ initialized: true, loading: false });
  },
}));
