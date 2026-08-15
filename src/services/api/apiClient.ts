// =============================================================================
// Backend API Client — authenticated HTTP calls using stored JWT
// All requests include the Bearer token from localStorage session.
// =============================================================================

import { getStoredSession } from '@/services/authClient';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1`;

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const stored = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (stored?.token) {
    headers['Authorization'] = `Bearer ${stored.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.message || `API error ${res.status}`);
  }

  // Unwrap envelope: { success, data, ... }
  return (body.data ?? body) as T;
}

async function apiFormData<T>(path: string, formData: FormData): Promise<T> {
  const stored = getStoredSession();
  const headers: Record<string, string> = {};

  if (stored?.token) {
    headers['Authorization'] = `Bearer ${stored.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || `API error ${res.status}`);
  }
  return (body.data ?? body) as T;
}

// ---------------------------------------------------------------------------
// Users / Profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  accountType: string;
  hasExperience: boolean;
  bio: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  country: string | null;
  city: string | null;
  completionPercentage?: number;
  missingFields?: string[];
}

export interface DashboardData {
  userInfo?: UserProfile;
  currentPlan?: string;
  remainingCredits?: { job: number; ai: number; resume: number; ats: number };
  resumeStatus?: string;
  applicationsCount?: number;
  interviewCount?: number;
  offerCount?: number;
  jobsInProgress?: number;
  recentActivity?: Application[];
  profileCompletion?: number;
  totalApplications?: number;
  activeApplications?: number;
  successRate?: number;
  tier?: string;
}

export interface Statistics {
  applications: number;
  interviews: number;
  offers: number;
}

export const usersApi = {
  getMe: () => apiFetch<UserProfile>('/users/me'),
  getProfile: () => apiFetch<UserProfile>('/users/profile'),
  updateProfile: (data: Partial<UserProfile>) =>
    apiFetch<UserProfile>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getDashboard: () => apiFetch<DashboardData>('/users/dashboard'),
  getStatistics: () => apiFetch<Statistics>('/users/statistics'),
  getPreferences: () => apiFetch<Record<string, any>>('/users/preferences'),
  updatePreferences: (data: Record<string, any>) =>
    apiFetch<Record<string, any>>('/users/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ---------------------------------------------------------------------------
// Resume
// ---------------------------------------------------------------------------

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  storagePath: string;
  publicUrl: string | null;
  fileSize: number;
  mimeType: string;
  version: number;
  isDefault: boolean;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export const resumeApi = {
  getAll: () => apiFetch<Resume[]>('/resume'),

  upload: (file: File) => {
    const form = new FormData();
    form.append('resume', file);
    return apiFormData<Resume>('/resume/upload', form);
  },

  setDefault: (id: string) =>
    apiFetch<Resume>(`/resume/${id}/default`, {
      method: 'PATCH',
      body: JSON.stringify({ isDefault: true }),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/resume/${id}`, { method: 'DELETE' }),

  async download(resume: Resume): Promise<void> {
    const stored = getStoredSession();
    const response = await fetch(`${API_BASE}/resume/${resume.id}/download`, {
      headers: stored?.token ? { Authorization: `Bearer ${stored.token}` } : {},
    });
    if (!response.ok) throw new Error('Could not download this resume.');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = resume.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export interface Application {
  id: string;
  userId: string;
  status: string;
  appliedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  jobId?: string;
  job?: {
    id: string;
    title: string;
    companyName?: string;
    company?: { name: string };
    location?: string;
    salary?: string;
  };
}

export interface ApplicationsPage {
  items: Application[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const applicationsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    return apiFetch<ApplicationsPage>(`/applications?${qs}`);
  },
};

// ---------------------------------------------------------------------------
// ATS Checker (via backend AI / ATS module)
// ---------------------------------------------------------------------------

export interface AtsAnalysisResult {
  overallScore: number;
  categories: {
    formatting: { score: number; status: string; items: string[] };
    keywords: { score: number; status: string; items: string[] };
    contact: { score: number; status: string; items: string[] };
    impact: { score: number; status: string; items: string[] };
  };
  jdMatchScore?: number;
}

export const atsApi = {
  analyze: (resumeId: string, jdText?: string) =>
    apiFetch<AtsAnalysisResult>('/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({ resumeId, jdText }),
    }),
};

// ---------------------------------------------------------------------------
// AI Features
// ---------------------------------------------------------------------------

export const aiApi = {
  generateBio: (resumeText: string) =>
    apiFetch<{ content: string; message: string }>('/ai/bio/generate', {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    }),
};

// ---------------------------------------------------------------------------
// Auth (password change)
// ---------------------------------------------------------------------------

export const authApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
