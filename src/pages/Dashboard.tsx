import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { toast } from '@/store/toastStore';
import { usersApi, resumeApi, DashboardData, Application, Resume, plansApi, paymentsApi, subscriptionsApi, AdminManagedApplication } from '@/services/api/apiClient';
import RazorpayCheckout from '@/components/ui/RazorpayCheckout';
import { getStoredSession } from '@/services/authClient';
import { ROUTES } from '@/config/appConfig';

// Map backend status enum to display status
function mapStatus(status: string): 'applied' | 'interviewing' | 'offered' | 'rejected' | 'pending' {
  switch (status) {
    case 'APPLYING':
    case 'APPLIED':
      return 'applied';
    case 'INTERVIEW':
      return 'interviewing';
    case 'OFFER':
    case 'JOINED':
      return 'offered';
    case 'REJECTED':
    case 'CANCELLED':
      return 'rejected';
    default:
      return 'pending';
  }
}

function getStatusBadge(status: string) {
  const mapped = mapStatus(status);
  switch (mapped) {
    case 'applied':    return <Badge variant="primary">Applied</Badge>;
    case 'interviewing': return <Badge variant="warning">Interviewing</Badge>;
    case 'offered':    return <Badge variant="success">Offered</Badge>;
    case 'rejected':   return <Badge variant="gray">Archived</Badge>;
    default:           return <Badge variant="gray">{status}</Badge>;
  }
}

function getResumeFileName(resume: Resume | null): string {
  if (!resume) return 'No resume uploaded';
  return resume.fileName || 'resume.pdf';
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  // adminApps: applications pushed by admin (new format)
  const [adminApps, setAdminApps] = useState<AdminManagedApplication[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [localResumeError, setLocalResumeError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const latestRequest = useRef(0);
  // The persisted dashboard payload is the canonical application collection.
  // Retain the legacy list only for older API deployments that have not sent it yet.
  const allApps = adminApps.length > 0 ? adminApps : applications;

  const loadData = useCallback(async (isManualRefresh = false) => {
    const requestId = ++latestRequest.current;
    // On initial load: show loading skeleton. On refresh: keep existing data, show spinner.
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    if (!isManualRefresh) setError(null);
    try {
      // Fetch profile data
      let profile = null;
      try {
        profile = await usersApi.getProfile();
        if (requestId === latestRequest.current) setProfileData(profile);
      } catch (err) {
        console.warn('[Demo Mode] Profile fetch failed');
      }

      const [dashRes, resumesRes, plansRes, paymentsRes, subRes] = await Promise.allSettled([
        usersApi.getDashboard(),
        resumeApi.getAll(),
        plansApi.getPublic(),
        paymentsApi.getHistory(),
        subscriptionsApi.getCurrent(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const dashData: DashboardData = dashRes.value;
        if (requestId !== latestRequest.current) return;
        setDashboard(dashData);

        // Admin-pushed applications are the source of truth
        setAdminApps(Array.isArray(dashData.applications) ? dashData.applications : []);
      } else if (!isManualRefresh) {
        if (requestId === latestRequest.current) setError('Unable to load your applications. Please try again.');
      } else {
        // Refresh failed — keep existing data, show a non-destructive toast
        toast.warning('Unable to refresh. Your current data is still shown.', 'Refresh');
      }

      let resumeData: Resume | null = null;
      if (resumesRes.status === 'fulfilled' && Array.isArray(resumesRes.value) && resumesRes.value.length > 0) {
        const found = resumesRes.value.find((r) => r.isDefault) || resumesRes.value[0];
        if (found) resumeData = found;
      }
      if (resumeData && requestId === latestRequest.current) setActiveResume(resumeData);

      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value)) {
        if (requestId === latestRequest.current) setPlans(plansRes.value);
      }

      if (subRes.status === 'fulfilled' && subRes.value) {
        if (requestId === latestRequest.current) setSubscription(subRes.value);
      } else if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value)) {
        const payments = paymentsRes.value as any[];
        const success = payments.find((p) => p.status === 'SUCCESS');
        if (success && success.subscription && requestId === latestRequest.current) setSubscription(success.subscription);
      }
    } catch (err: any) {
      if (!isManualRefresh) {
        if (requestId === latestRequest.current) setError(err?.message || 'Unable to load your applications. Please try again.');
      } else {
        toast.warning('Unable to refresh. Your current data is still shown.', 'Refresh');
      }
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user]);

  const getWeeklyStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = [0,0,0,0,0,0,0]; // Mon-Sun
    let thisWeekTotal = 0;
    let lastWeekTotal = 0;

    allApps.forEach((app: any) => {
      const d = new Date(app.appliedDate || app.appliedAt || app.createdAt);
      if (d >= oneWeekAgo && d <= now) {
        thisWeekTotal++;
        const day = d.getDay(); // 0 is Sunday, 1 is Monday
        const idx = day === 0 ? 6 : day - 1;
        thisWeek[idx]++;
      } else if (d >= twoWeeksAgo && d < oneWeekAgo) {
        lastWeekTotal++;
      }
    });

    return { thisWeek, thisWeekTotal, diff: thisWeekTotal - lastWeekTotal };
  };
  const weeklyStats = getWeeklyStats();
  const daysRemaining = subscription && subscription.expiresAt ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const progressPercent = subscription && subscription.startDate && subscription.expiresAt ? Math.min(100, Math.max(0, ((Date.now() - new Date(subscription.startDate).getTime()) / (new Date(subscription.expiresAt).getTime() - new Date(subscription.startDate).getTime())) * 100)) : 0;


  useEffect(() => {
    loadData();
  }, [loadData]);

  const isSubscriptionUsable = Boolean(
    subscription &&
    subscription.status === 'ACTIVE' &&
    new Date(subscription.expiresAt || 0).getTime() > Date.now(),
  );

  useEffect(() => {
    if (!loading && !isSubscriptionUsable) {
      navigate(ROUTES.SUBSCRIPTIONS, { replace: true });
    }
  }, [loading, isSubscriptionUsable, navigate]);

  const handleResumeFileSelected = async (file: File) => {
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setLocalResumeError('Resume file size exceeds the 5MB limit.');
      return;
    }
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
      setLocalResumeError('Only PDF and Word (.doc, .docx) files are supported.');
      return;
    }
    setLocalResumeError(null);
    setUploadingResume(true);
    try {
      const uploaded = await resumeApi.upload(file);
      setActiveResume(uploaded);
      toast.success(`Resume uploaded: ${uploaded.fileName}`, 'Resume Updated');
      // Reload dashboard to refresh resume status
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload resume.', 'Upload Failed');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleResumeFileSelected(files[0]);
  };

  const filteredApps = allApps.filter((app: any) => {
    const q = searchQuery.toLowerCase();
    // New admin format
    if (app.jobTitle) {
      return (
        app.jobTitle.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q) ||
        (app.campaign || '').toLowerCase().includes(q)
      );
    }
    // Legacy Prisma format
    return (
      (app.job?.company?.name || '').toLowerCase().includes(q) ||
      (app.job?.title || '').toLowerCase().includes(q)
    );
  });

  const downloadResume = async () => {
    if (!activeResume) return;
    try {
      await resumeApi.download(activeResume);
    } catch (err: any) {
      toast.error(err.message || 'Unable to download resume.', 'Download Failed');
    }
  };

  // Calculate profile completion
  const getProfileCompletion = () => {
    if (!profileData) return 0;
    let completed = 0;
    let total = 5; // bio, linkedinUrl, githubUrl, phone, full profile

    if (profileData.bio && profileData.bio.trim()) completed++;
    if (profileData.linkedinUrl && profileData.linkedinUrl.trim()) completed++;
    if (profileData.githubUrl && profileData.githubUrl.trim()) completed++;
    if (profileData.phone && profileData.phone.trim()) completed++;
    if (profileData.fullName && profileData.fullName.trim()) completed++;

    return Math.round((completed / total) * 100);
  };

  const isProfileComplete = getProfileCompletion() === 100;

  if (loading) {
    return (
      <div className="space-y-6">
        <SEO title="Dashboard Loading" />
        <PageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Failed to Load Dashboard"
          message={error}
          retryText="Retry"
          onRetry={loadData}
        />
      </div>
    );
  }

  // These values are managed by an administrator and deliberately remain
  // independent from application/campaign records.
  const stats = dashboard?.dashboardMetrics ?? {
    applications: dashboard?.applicationsCount ?? '0',
    responses: dashboard?.responsesCount ?? '0',
    interviews: dashboard?.interviewCount ?? '0',
    offers: dashboard?.offerCount ?? '0',
    rejected: dashboard?.rejectedCount ?? '0',
    shortlisted: dashboard?.shortlistedCount ?? '0',
  };

  return (
    <>
      <SEO title="Candidate Dashboard" description="Track your automated job application status." />
      <div className="space-y-8 text-left">

        {/* Dashboard Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Job Applications
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Active application campaigns for:{' '}
              <span className="font-semibold">
                {dashboard?.userInfo?.fullName || user?.email} ({dashboard?.userInfo?.accountType || '—'})
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Updating...
                </span>
              ) : 'Refresh'}
            </Button>
            <Button variant="gradient" size="sm">
              New Application Campaign
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics Grid — real data from backend */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Total Submitted</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300">Live</span>
            </div>
            <p title={String(stats.applications)} className="mt-2 break-words text-2xl font-bold leading-snug text-text-primary-light dark:text-text-primary-dark sm:text-3xl">{stats.applications}</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start"><span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Responses</span><span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-900/25 dark:text-violet-300">Live</span></div>
            <p title={String(stats.responses)} className="mt-2 break-words text-2xl font-bold leading-snug text-text-primary-light dark:text-text-primary-dark sm:text-3xl">{stats.responses}</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Interviews Scheduled</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 dark:bg-yellow-900/25 dark:text-yellow-300">In Progress</span>
            </div>
            <p title={String(stats.interviews)} className="mt-2 break-words text-2xl font-bold leading-snug text-text-primary-light dark:text-text-primary-dark sm:text-3xl">{stats.interviews}</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Offers Secured</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300">Success</span>
            </div>
            <p title={String(stats.offers)} className="mt-2 break-words text-2xl font-bold leading-snug text-text-primary-light dark:text-text-primary-dark sm:text-3xl">{stats.offers}</p>
          </Card>

          <Card className="p-6"><div className="flex justify-between items-start"><span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Rejected</span></div><p title={String(stats.rejected)} className="mt-2 break-words text-2xl font-bold leading-snug text-text-primary-light dark:text-text-primary-dark sm:text-3xl">{stats.rejected}</p></Card>
          <Card className="p-6"><div className="flex justify-between items-start"><span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Shortlisted</span></div><p title={String(stats.shortlisted)} className="mt-2 break-words text-2xl font-bold leading-snug text-text-primary-light dark:text-text-primary-dark sm:text-3xl">{stats.shortlisted}</p></Card>
        </div>

        {/* Two-Column Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Column: Applications List */}
          <div className={`lg:col-span-2 space-y-6`}>

            {/* Weekly Submissions Graph */}
            <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">Submissions This Week</h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Live candidate dispatch volume by day
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  Weekly Report
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-6 pt-2">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-end gap-2.5 h-32 pt-6">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                      // The chart is based only on dated application records. It
                      // must not attempt arithmetic on the admin-managed text.
                      const hasRecords = weeklyStats.thisWeek.some((count) => count > 0);
                      const dayCount = hasRecords 
                        ? weeklyStats.thisWeek[idx]
                        : 0;
                      
                      const maxVal = Math.max(...weeklyStats.thisWeek, 1);
                      const heightPercent = Math.max(dayCount > 0 ? Math.round((dayCount / maxVal) * 100) : 6, 6);

                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-end justify-center h-full relative group p-0.5 cursor-pointer">
                            <div
                              className={`w-full rounded-md transition-all duration-500 ${
                                dayCount > 0
                                  ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-sm shadow-blue-500/20'
                                  : 'bg-slate-200 dark:bg-slate-700/50'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                            {/* Hover Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-lg transition-opacity z-20 whitespace-nowrap">
                              {day}: {dayCount} applications
                            </div>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark tracking-tight">
                    {weeklyStats.thisWeekTotal > 0 ? weeklyStats.thisWeekTotal : '—'}
                  </div>
                  <div className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    applications
                  </div>
                  <div className={`text-xs mt-2 font-semibold inline-flex items-center gap-1 ${
                    weeklyStats.thisWeekTotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                  }`}>
                    {weeklyStats.thisWeekTotal > 0 ? `${weeklyStats.diff >= 0 ? '+' : ''}${weeklyStats.diff} vs last week` : 'No dated records this week'}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              {/* List Toolbar */}
              <div className="p-5 border-b border-border-light dark:border-border-dark bg-white dark:bg-card-dark flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:max-w-xs relative">
                  <input
                    type="text"
                    placeholder="Filter applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 px-3 pl-9 py-2 text-sm bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary-light dark:text-text-primary-dark"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                </div>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                  Showing {filteredApps.length} of {allApps.length} applications
                </span>
              </div>

              {isRefreshing && (
                <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Refreshing your applications…
                </div>
              )}

              {filteredApps.length > 0 ? (
                <div className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredApps.map((app: any) => {
                    // Support both admin-pushed format and legacy Prisma format
                    const isAdminFormat = Boolean(app.jobTitle);
                    const jobTitle = isAdminFormat ? app.jobTitle : (app.job?.title || 'Job Title Unavailable');
                    const company = isAdminFormat ? app.company : (app.job?.company?.name || 'Company');
                    const location = isAdminFormat ? app.location : (app.job?.location || '');
                    const appliedDate = isAdminFormat
                      ? (app.appliedDate ? new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
                      : (app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
                    const campaign = isAdminFormat ? app.campaign : '';
                    const status = app.status || 'Pending';

                    const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
                      'Preparing': { label: 'Preparing', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
                      'Applied': { label: 'Applied', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dot: 'bg-blue-500' },
                      'Under Review': { label: 'Under Review', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', dot: 'bg-purple-500' },
                      'Shortlisted': { label: 'Shortlisted', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', dot: 'bg-cyan-500' },
                      'Interview Scheduled': { label: 'Interview Scheduled', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', dot: 'bg-yellow-500' },
                      'Interviewing': { label: 'Interviewing', color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500' },
                      'Offer': { label: 'Offer', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
                      'Accepted': { label: 'Accepted', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300', dot: 'bg-green-500' },
                      'Rejected': { label: 'Rejected', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', dot: 'bg-red-400' },
                      'Withdrawn': { label: 'Withdrawn', color: 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400', dot: 'bg-slate-400' },
                      // Legacy Prisma statuses
                      'APPLIED': { label: 'Applied', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dot: 'bg-blue-500' },
                      'INTERVIEW': { label: 'Interviewing', color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500' },
                      'OFFER': { label: 'Offer', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
                      'REJECTED': { label: 'Rejected', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', dot: 'bg-red-400' },
                      'PENDING': { label: 'Pending', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
                    };
                    const sc = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' };

                    return (
                      <div
                        key={app.id}
                        className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-bg-alt-light/40 dark:hover:bg-bg-alt-dark/15 transition-colors cursor-pointer group"
                        onClick={() => setSelectedApp(app)}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Company initial avatar */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {company.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <h4 className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark truncate">
                              {jobTitle}
                            </h4>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium truncate">
                              {company}{location ? ` • ${location}` : ''} • Applied {appliedDate}
                            </p>
                            {campaign && (
                              <span className="inline-block text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                {campaign}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-slate-400 text-xs transition-opacity">›</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10">
                  {searchQuery ? (
                    <EmptyState
                      title="No applications found"
                      description={`No active application matches your search query: "${searchQuery}"`}
                      actionText="Clear Filter"
                      onAction={() => setSearchQuery('')}
                    />
                  ) : isRefreshing ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6">
                      <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                      </svg>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Fetching latest applications…</p>
                    </div>
                  ) : (
                    <EmptyState
                      title="No applications yet"
                      description="Once your job application campaigns begin, they will appear here."
                    />
                  )}
                </div>
              )}
            </Card>


            {/* APPLYONE BY THE NUMBERS & SIMPLE PROCESS (Option 3 & Option 4) */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50/40 to-blue-50/20 dark:from-card-dark dark:via-slate-900/90 dark:to-slate-950 p-6 shadow-sm space-y-6 overflow-hidden">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <div>
                  <div className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-blue-600 dark:text-cyan-400">
                    APPLYONE BY THE NUMBERS
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                    Delivering Results That Matter
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    We focus on what counts — more applications, more interviews, and more opportunities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ATS_CHECKER)}
                  className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  View Our Results →
                </button>
              </div>

              {/* 5 Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-base mb-1">⭐</span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">25K+</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Happy Users</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-base mb-1">🚀</span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">98K+</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Applications Submitted</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-base mb-1">📅</span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">12.5K+</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Interviews Scheduled</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-base mb-1">🏆</span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">2.1K+</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Offers Secured</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center col-span-2 sm:col-span-1">
                  <span className="text-base mb-1">🌍</span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">20+</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Countries Worldwide</span>
                </div>
              </div>

              {/* Simple Process. Powerful Results. (Option 4) */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4 text-left">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Simple Process. Powerful Results.
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    We handle the heavy lifting so you can focus on preparing for interviews.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400">01</span>
                      <span className="text-sm">📄</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Share Your Profile</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Upload your resume and preferences.
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">02</span>
                      <span className="text-sm">🎯</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">We Find & Apply</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Our team finds relevant jobs and applies on your behalf.
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">03</span>
                      <span className="text-sm">📈</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Track & Optimize</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      We monitor responses and optimize your campaign.
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">04</span>
                      <span className="text-sm">🎉</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Get Interviewed</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      You focus on interviews and landing the offer.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Subscription + Resume Manager Column */}
          <div className="space-y-6">
            {/* Active Subscription Details */}
            <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent pointer-events-none" />
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Active Subscription</h3>
              {subscription && subscription.status === 'ACTIVE' ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                      {subscription.plan?.name || 'Premium'} Plan
                    </div>
                    <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Your plan will expire on</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {new Date(subscription.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      {daysRemaining} days remaining
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm">No active subscription — choose a plan below</div>
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    {(plans.length ? plans : [{ id: 'professional', name: 'Professional', monthlyPrice: 999 }]).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-text-secondary-light">{p.monthlyPrice ? `₹${p.monthlyPrice}` : '—'} / month</div>
                        </div>
                        <div>
                          <RazorpayCheckout planId={p.id} onSuccess={async ()=>{ await loadData(); toast.success('Subscription activated'); }} onError={(e)=>toast.error(e?.message||'Payment failed')} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Application Usage */}
            {subscription && subscription.status === 'ACTIVE' && (
              <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md">
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Application Usage</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Credits Remaining</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{subscription.remainingJobCredits || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Applications Used</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{stats.applications}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Monthly Limit</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{subscription.plan?.jobCredits || 'Unlimited'}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Tips to Improve */}
            <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">Tips to Improve</h3>
              <ul className="space-y-3">
                <li className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-blue-500">✦</span> Customize your resume for each application to pass ATS.
                </li>
                <li className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-blue-500">✦</span> Apply to relevant positions matching your core skills.
                </li>
                {String(stats.applications).trim() !== '' && String(stats.applications) !== '0' && (
                  <li className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-blue-500">✦</span> You have {stats.applications} recent applications, follow up on pending ones!
                  </li>
                )}
                {!isProfileComplete && (
                  <li className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-blue-500">✦</span> Complete your profile to boost visibility.
                  </li>
                )}
              </ul>
            </Card>

            <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                    Profile Asset
                  </span>
                  {activeResume && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                      ✓ Active
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  My Resume
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 leading-relaxed">
                  Your resume is matched dynamically against listings to evaluate ATS compliance.
                </p>

                {/* Current Resume details */}
                {activeResume ? (
                  <div className="mt-5 p-3 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-bg-dark flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl flex-shrink-0">📄</span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate block">
                          {getResumeFileName(activeResume)}
                        </span>
                        <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block">
                          Version {activeResume.version} · {(activeResume.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={downloadResume}
                      className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-white dark:hover:bg-card-dark text-text-primary-light dark:text-text-primary-dark transition-colors flex-shrink-0 cursor-pointer"
                      title="Download Resume"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 p-3 rounded-lg border border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 text-center">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                      No resume uploaded yet
                    </p>
                    <p className="text-[10px] text-orange-500 dark:text-orange-500 mt-0.5">
                      Upload your resume to start applying
                    </p>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-6 border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-border-light dark:border-border-dark bg-white dark:bg-card-dark'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    id="resume-file-update"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) handleResumeFileSelected(files[0]);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />

                  {uploadingResume ? (
                    <div className="flex flex-col items-center justify-center space-y-2 py-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
                        Uploading resume...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="block text-xl">📤</span>
                      <span className="block text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                        {activeResume ? 'Drag new file or click to replace' : 'Drag file or click to upload'}
                      </span>
                      <span className="block text-[10px]">PDF or Word formats up to 5MB</span>
                    </div>
                  )}
                </div>

                {localResumeError && (
                  <p className="text-xs text-red-500 font-semibold mt-2 text-left">{localResumeError}</p>
                )}
              </div>
            </Card>

            {/* Profile Completion Card */}
            <Card className={`p-5 border shadow-sm ${
              isProfileComplete
                ? 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/10'
                : 'border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-950/10'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h4 className={`text-sm font-bold ${
                  isProfileComplete
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-orange-900 dark:text-orange-100'
                }`}>
                  {isProfileComplete ? '✓ Profile Complete' : '⚠ Profile Incomplete'}
                </h4>
                {!isProfileComplete && (
                  <a href={ROUTES.SETTINGS} className="text-xs font-semibold px-2 py-1 rounded bg-orange-200 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-300 dark:hover:bg-orange-900/60 transition-colors">
                    Complete Now
                  </a>
                )}
              </div>
              <div className={`w-full rounded-full h-2 ${
                isProfileComplete
                  ? 'bg-green-200 dark:bg-green-900/30'
                  : 'bg-orange-200 dark:bg-orange-900/30'
              }`}>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isProfileComplete
                      ? 'bg-green-500 dark:bg-green-400'
                      : 'bg-orange-500 dark:bg-orange-400'
                  }`}
                  style={{ width: `${getProfileCompletion()}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${
                isProfileComplete
                  ? 'text-green-700 dark:text-green-200'
                  : 'text-orange-700 dark:text-orange-200'
              }`}>
                {getProfileCompletion()}% complete
              </p>
              {!isProfileComplete && (
                <div className="mt-3 text-xs space-y-1">
                  <p className={isProfileComplete ? 'text-green-700 dark:text-green-200' : 'text-orange-700 dark:text-orange-200'}>
                    Missing: {
                      [
                        !profileData?.fullName && 'Full Name',
                        !profileData?.phone && 'Phone',
                        !profileData?.bio && 'Bio',
                        !profileData?.linkedinUrl && 'LinkedIn',
                        !profileData?.githubUrl && 'GitHub'
                      ]
                        .filter(Boolean)
                        .join(', ')
                    }
                  </p>
                </div>
              )}
            </Card>
          </div>

        </div>

        {/* ApplyOne Spotlight / Why ApplyOne Premium Showcase */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50/50 to-blue-50/20 dark:from-card-dark dark:via-slate-900/90 dark:to-slate-950 p-7 sm:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-8"
        >
          {/* Top Banner Announcement */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0 animate-bounce">🚀</span>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  We're building the future of smarter job searching.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  ApplyOne is continuously evolving to help you spend less time managing your job search and more time preparing for the opportunities that matter.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-primary dark:text-cyan-400 whitespace-nowrap bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700">
              More powerful career tools are coming soon
            </span>
          </div>

          {/* Section Main Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl text-left">
              <span className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-blue-600 dark:text-cyan-400">
                ApplyOne Spotlight
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Your Career. Smarter with ApplyOne.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Everything you need to build a stronger profile, discover better opportunities, and stay organized throughout your job search — all in one place.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="gradient"
                size="md"
                onClick={() => navigate(ROUTES.ATS_CHECKER)}
                className="rounded-xl px-5 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Explore ApplyOne
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(ROUTES.SUPPORT)}
                className="rounded-xl px-5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                What's New
              </Button>
            </div>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {/* Feature 1 */}
            <div className="group p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Smart Job Matching
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Discover opportunities that align with your skills, experience and career goals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                ATS-Powered Resume Insights
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Understand how your resume performs and discover ways to improve it for real opportunities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                💼
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Application Management
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Keep your applications organized and stay on top of every opportunity.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-5 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 bg-gradient-to-b from-purple-50/30 to-white dark:from-purple-950/20 dark:to-slate-900/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                ✨
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  AI Resume
                </h3>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Soon
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Create smarter, job-focused resumes tailored to the opportunities you care about.
              </p>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedApp(null); }}
        >
          <div className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-card-dark rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border-light dark:border-border-dark animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark px-6 py-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {(selectedApp.company || selectedApp.job?.company?.name || 'J').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-base text-text-primary-light dark:text-text-primary-dark truncate">
                    {selectedApp.jobTitle || selectedApp.job?.title || 'Application Details'}
                  </h2>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
                    {selectedApp.company || selectedApp.job?.company?.name || '—'}
                    {(selectedApp.location || selectedApp.job?.location) && ` · ${selectedApp.location || selectedApp.job?.location}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5 space-y-6">
              {/* Status + Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Status', value: selectedApp.status || '—' },
                  { label: 'Applied', value: selectedApp.appliedDate ? new Date(selectedApp.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (selectedApp.appliedAt ? new Date(selectedApp.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—') },
                  { label: 'Job Type', value: selectedApp.jobType || '—' },
                  { label: 'Campaign', value: selectedApp.campaign || '—' },
                  { label: 'Source', value: selectedApp.source || '—' },
                  { label: 'Salary', value: selectedApp.salary || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Job URL */}
              {selectedApp.jobUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Job URL</p>
                  <a
                    href={selectedApp.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {selectedApp.jobUrl}
                  </a>
                </div>
              )}

              {/* Job Reference */}
              {selectedApp.jobReference && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Job Reference / ID</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{selectedApp.jobReference}</p>
                </div>
              )}

              {/* Recruiter Contact */}
              {selectedApp.recruiterContact && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Recruiter / Contact</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selectedApp.recruiterContact}</p>
                </div>
              )}

              {/* Notes */}
              {selectedApp.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">{selectedApp.notes}</p>
                </div>
              )}

              {/* Status Timeline */}
              {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Status Timeline</p>
                  <div className="relative pl-5 space-y-3">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
                    {[...selectedApp.statusHistory].reverse().map((h: any, i: number) => (
                      <div key={i} className="relative flex gap-3 items-start">
                        <div className="absolute -left-[13px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-card-dark" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{h.status}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            {h.note && <span className="ml-2 text-slate-400">— {h.note}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {selectedApp.updatedAt && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
                  Last updated: {new Date(selectedApp.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
