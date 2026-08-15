import { AuthSession } from '@/types/auth';
import { ServiceResponse } from '@/types/services';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1`;
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
  async signIn(email: string, password: string): Promise<ServiceResponse<AuthSession>> {
    try {
      const payload = await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return { success: true, data: toAuthSession(payload), error: null, message: 'Signed in successfully.' };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  async signUp(formData: FormData): Promise<ServiceResponse<AuthSession>> {
    try {
      const payload = await request('/auth/signup', { method: 'POST', body: formData });
      return { success: true, data: toAuthSession(payload), error: null, message: 'Account created successfully.' };
    } catch (error: any) {
      return { success: false, data: null, error: error.message, message: error.message };
    }
  },

  // Google signup/login disabled — no-op placeholders kept for backward compatibility.
  async startGoogleSignup(_formData: FormData): Promise<ServiceResponse<{ authorizationUrl: string }>> {
    return { success: false, data: null, error: 'Google signup disabled', message: 'Google signup disabled' };
  },
  startGoogleLogin(): void {
    // noop
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
