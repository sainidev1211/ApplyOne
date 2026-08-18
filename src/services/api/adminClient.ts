import { getStoredSession } from '../authClient';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1`;

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  accountType: 'STUDENT' | 'FRESHER' | 'PROFESSIONAL' | string;
  role: 'USER' | 'ADMIN' | 'EMPLOYEE' | string;
  hasExperience: boolean;
  companyName?: string | null;
  roleDetails?: string | null;
  employmentTypes?: string[];
  expectedPackageFullTime?: string | null;
  expectedPackagePartTime?: string | null;
  expectedPackageInternship?: string | null;
  lastMonthlyPackage?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  resumeFileName?: string | null;
  resumePath?: string | null;
  resumes?: Array<{
    id: string;
    fileName: string;
    storagePath: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
  }>;
  resumesCount?: number;
  preferences?: Record<string, any>;
  dashboardData?: {
    currentPlan?: string;
    remainingCredits?: {
      job?: number;
      ai?: number;
      resume?: number;
      ats?: number;
    };
    applicationsCount?: string | number;
    interviewCount?: string | number;
    offerCount?: string | number;
    dashboardMetrics?: {
      applications?: string | number;
      responses?: string | number;
      interviews?: string | number;
      offers?: string | number;
      rejected?: string | number;
      shortlisted?: string | number;
    };
    jobsInProgress?: number;
    adminMessage?: string;
    customAlert?: string;
    updatedAt?: string;
  };
  subscriptionInfo?: {
    planName?: string;
    startDate?: string | null;
    expiresAt?: string | null;
    status?: string;
    autoRenew?: boolean;
    amount?: number | null;
    currency?: string;
  };
  paymentInfo?: {
    status?: string;
    amount?: number | null;
    currency?: string;
    paymentId?: string | null;
    gatewayOrderId?: string | null;
    paidAt?: string | null;
    method?: string;
  };
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string | null;
    read: boolean;
    createdAt: string;
  }>;
  notificationsCount?: number;
  adminNotes?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface AdminDashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalAdmins: number;
    usersWithResumes: number;
    studentsCount: number;
    freshersCount: number;
    professionalsCount: number;
    activeSubscribers: number;
    applicationsSubmitted: number;
    interviews: number;
    offers: number;
    totalRevenue: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    accountType: string;
    role: string;
    hasResume: boolean;
    resumeFileName?: string | null;
    createdAt: string;
    isActive: boolean;
  }>;
}

export type DashboardMetricValue = string | number;

export interface DashboardUpdatePayload {
  currentPlan?: string;
  remainingCredits?: { job?: number; ai?: number; resume?: number; ats?: number };
  jobsInProgress?: number;
  adminMessage?: string;
  dashboardMetrics?: {
    applications?: DashboardMetricValue;
    responses?: DashboardMetricValue;
    interviews?: DashboardMetricValue;
    offers?: DashboardMetricValue;
    rejected?: DashboardMetricValue;
    shortlisted?: DashboardMetricValue;
  };
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const session = getStoredSession();
  const token = session?.token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  return body.data !== undefined ? body.data : body;
}

export const adminClient = {
  async getMetrics(): Promise<AdminDashboardMetrics> {
    return request('/admin/dashboard');
  },

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    accountType?: string;
    hasResume?: string;
  } = {}): Promise<{ items: AdminUser[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.accountType) query.set('accountType', params.accountType);
    if (params.hasResume) query.set('hasResume', params.hasResume);

    const queryString = query.toString();
    return request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  async getUser(id: string): Promise<AdminUser> {
    return request(`/admin/users/${encodeURIComponent(id)}`);
  },

  async updateUser(id: string, data: Partial<AdminUser> & { newPassword?: string }): Promise<AdminUser> {
    return request(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateDashboard(id: string, dashboardData: DashboardUpdatePayload): Promise<{ success: boolean; message: string; dashboardData: any }> {
    return request(`/admin/users/${encodeURIComponent(id)}/dashboard`, {
      method: 'PUT',
      body: JSON.stringify(dashboardData),
    });
  },

  async patchDashboard(id: string, dashboardData: DashboardUpdatePayload): Promise<{ success: boolean; message: string; dashboardData: any }> {
    return request(`/admin/users/${encodeURIComponent(id)}/dashboard`, {
      method: 'PATCH',
      body: JSON.stringify(dashboardData),
    });
  },

  async sendUserNotification(
    id: string,
    notification: { title: string; message: string; type?: string; link?: string },
  ): Promise<{ success: boolean; notification: any }> {
    return request(`/admin/users/${encodeURIComponent(id)}/notify`, {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },

  async broadcastNotification(
    notification: { title: string; message: string; type?: string; link?: string },
  ): Promise<{ success: boolean; message: string; notification: any }> {
    return request('/admin/users/broadcast-notification', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async seedAdmin(): Promise<any> {
    return request('/admin/users/seed-admin-account', {
      method: 'POST',
    });
  },

  getResumeDownloadUrl(resumePathOrUserId?: string | null, userIdFallback?: string | null): string {
    if (!resumePathOrUserId && !userIdFallback) return '#';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const target = resumePathOrUserId || userIdFallback || '';
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return target;
    }
    if (target.startsWith('/')) {
      return `${baseUrl}${target}`;
    }
    if (target.startsWith('uploads/')) {
      return `${baseUrl}/${target}`;
    }
    const userId = userIdFallback || target;
    return `${baseUrl}/admin/users/${encodeURIComponent(userId)}/resume/download`;
  },

  // ── Application Management ─────────────────────────────────────────────────

  async getApplications(
    userId: string,
    params: { status?: string; search?: string; page?: number; limit?: number } = {},
  ): Promise<{ items: AdminApplication[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    return request(`/admin/users/${encodeURIComponent(userId)}/applications?${q}`);
  },

  async createApplication(userId: string, data: Partial<AdminApplication>): Promise<{ success: boolean; application: AdminApplication }> {
    return request(`/admin/users/${encodeURIComponent(userId)}/applications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApplication(userId: string, appId: string, data: Partial<AdminApplication>): Promise<{ success: boolean; application: AdminApplication }> {
    return request(`/admin/users/${encodeURIComponent(userId)}/applications/${encodeURIComponent(appId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteApplication(userId: string, appId: string): Promise<{ success: boolean; message: string }> {
    return request(`/admin/users/${encodeURIComponent(userId)}/applications/${encodeURIComponent(appId)}`, {
      method: 'DELETE',
    });
  },

  async bulkCreateApplications(userId: string, applications: Partial<AdminApplication>[]): Promise<{ success: boolean; created: number; skipped: number }> {
    return request(`/admin/users/${encodeURIComponent(userId)}/applications/bulk`, {
      method: 'POST',
      body: JSON.stringify({ applications }),
    });
  },

  async getCampaigns(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value) query.set(key, String(value)); });
    return request(`/admin/campaigns?${query}`);
  },
  async getCampaign(id: string) { return request(`/admin/campaigns/${encodeURIComponent(id)}`); },
  async getSubscriptions(params: Record<string, string | number | undefined> = {}) { const q=new URLSearchParams(); Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!=='')q.set(k,String(v))}); return request(`/admin/subscriptions?${q}`); },
  async getSubscription(id:string){ return request(`/admin/subscriptions/${encodeURIComponent(id)}`); },
  async updateSubscription(id:string,data:Record<string,unknown>){ return request(`/admin/subscriptions/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(data)}); },
  async createCampaign(data: Record<string, unknown>) { return request('/admin/campaigns', { method: 'POST', body: JSON.stringify(data) }); },
  async updateCampaign(id: string, data: Record<string, unknown>) { return request(`/admin/campaigns/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }); },
};

export interface AdminApplication {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobType?: string;
  jobUrl?: string;
  jobReference?: string;
  salary?: string;
  status: string;
  appliedDate?: string;
  source?: string;
  campaign?: string;
  notes?: string;
  recruiterContact?: string;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
  createdAt?: string;
  updatedAt?: string;
}
