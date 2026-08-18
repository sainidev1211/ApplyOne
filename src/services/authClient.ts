import { AuthSession } from '@/types/auth';
import { ServiceResponse } from '@/types/services';

function normalizeBase(url?: string) {
  if (!url) return 'http://localhost:3000';
  let u = url.trim();
  if (u.endsWith('/')) u = u.slice(0, -1);
  u = u.replace(/\/api(?:\/v1)?$/i, '');
  return u;
}

const API_BASE = `${normalizeBase(import.meta.env.VITE_API_URL)}/api/v1`;
const SESSION_KEY = 'applyone_app_session';

export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accountType: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
}

export interface StoredSession {
  token: string;
  user: StoredUser;
}

export function getStoredSession(): StoredSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function saveSession(token: string, user: StoredUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

// Google session helpers removed — sessions are managed via standard sign-in/up flows.

export function updateStoredUser(values: Partial<StoredUser>): void {
  const session = getStoredSession();
  if (session) saveSession(session.token, { ...session.user, ...values });
}

function toAuthSession(payload: any): AuthSession {
  const user = payload.user as StoredUser;
  saveSession(payload.accessToken, user);
  return {
    user: {
      id: user.id,
      email: user.email,
      email_confirmed_at: new Date().toISOString(),
    },
    session: {
      access_token: payload.accessToken,
      token_type: payload.tokenType ?? 'Bearer',
      expires_in: payload.expiresIn ?? 604800,
    },
  };
}

async function request(path: string, init: RequestInit): Promise<any> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body.data ?? body;
}

export const authClient = {
  async signIn(email: string, password: string): Promise<ServiceResponse<AuthSession & { needsProfileCompletion?: boolean }>> {
    try {
      const payload = await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const session = toAuthSession(payload);
      return {
        success: true,
        data: { ...session, needsProfileCompletion: payload.needsProfileCompletion },
        error: null,
        message: 'Signed in successfully.',
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  async signUp(formData: FormData): Promise<ServiceResponse<AuthSession & { needsProfileCompletion?: boolean }>> {
    try {
      const payload = await request('/auth/signup', { method: 'POST', body: formData });
      const session = toAuthSession(payload);
      return {
        success: true,
        data: { ...session, needsProfileCompletion: payload.needsProfileCompletion },
        error: null,
        message: 'Account created successfully.',
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  async googleAuth(credential: string): Promise<ServiceResponse<AuthSession & { needsProfileCompletion?: boolean }>> {
    try {
      const payload = await request('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const session = toAuthSession(payload);
      return {
        success: true,
        data: { ...session, needsProfileCompletion: payload.needsProfileCompletion },
        error: null,
        message: 'Authenticated with Google.',
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  async completeProfile(formData: FormData): Promise<ServiceResponse<AuthSession>> {
    try {
      const stored = getStoredSession();
      const payload = await request('/auth/complete-profile', {
        method: 'POST',
        headers: stored?.token ? { Authorization: `Bearer ${stored.token}` } : undefined,
        body: formData,
      });
      return { success: true, data: toAuthSession(payload), error: null, message: 'Profile completed.' };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  async forgotPassword(email: string): Promise<ServiceResponse<{ isGoogleOnly?: boolean }>> {
    try {
      const payload = await request('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return {
        success: true,
        data: payload,
        error: null,
        message: payload.message || 'Recovery email sent if account exists.',
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<ServiceResponse<any>> {
    try {
      const payload = await request('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      return {
        success: true,
        data: payload,
        error: null,
        message: payload.message || 'Password reset successfully.',
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  async getCurrentUser(): Promise<ServiceResponse<StoredUser>> {
    const stored = getStoredSession();
    if (!stored) return { success: false, data: null, error: 'No active session.', message: 'No active session.' };
    try {
      const user = await request('/auth/me', { headers: { Authorization: `Bearer ${stored.token}` } });
      return { success: true, data: user, error: null, message: 'Session restored.' };
    } catch (error: any) {
      clearStoredSession();
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },
};
