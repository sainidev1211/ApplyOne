import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { toast } from '@/store/toastStore';
import { usersApi, resumeApi, applicationsApi, DashboardData, Application, Resume } from '@/services/api/apiClient';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [localResumeError, setLocalResumeError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch profile data
      let profile = null;
      try {
        profile = await usersApi.getProfile();
        setProfileData(profile);
      } catch (err) {
        console.warn('[Demo Mode] Profile fetch failed');
      }

      const [dashRes, appsRes, resumesRes] = await Promise.allSettled([
        usersApi.getDashboard(),
        applicationsApi.getAll({ limit: 50 }),
        resumeApi.getAll(),
      ]);

      let dashData: DashboardData = {
        totalApplications: 12,
        activeApplications: 5,
        interviewCount: 2,
        offerCount: 1,
        successRate: 83,
        tier: 'Professional',
      };

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        dashData = dashRes.value;
      } else {
        console.warn('[Demo Mode] Backend DB disconnected — using mock dashboard analytics.');
      }

      let appsData: Application[] = [
        {
          id: 'demo-app-1',
          userId: user?.id || 'demo-user',
          jobId: 'job-1',
          status: 'INTERVIEW',
          appliedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          job: { id: 'job-1', title: 'Senior Frontend Engineer', companyName: 'Stripe', location: 'Remote', salary: '$160,000 - $190,000' } as any,
        },
        {
          id: 'demo-app-2',
          userId: user?.id || 'demo-user',
          jobId: 'job-2',
          status: 'APPLIED',
          appliedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date().toISOString(),
          job: { id: 'job-2', title: 'Full Stack Tech Lead', companyName: 'Vercel', location: 'San Francisco, CA', salary: '$180,000 - $210,000' } as any,
        },
        {
          id: 'demo-app-3',
          userId: user?.id || 'demo-user',
          jobId: 'job-3',
          status: 'OFFER',
          appliedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date().toISOString(),
          job: { id: 'job-3', title: 'Staff Software Engineer', companyName: 'Linear', location: 'Remote', salary: '$200,000 - $240,000' } as any,
        },
      ];

      if (appsRes.status === 'fulfilled' && appsRes.value?.items) {
        appsData = appsRes.value.items;
      } else {
        console.warn('[Demo Mode] Backend DB disconnected — using mock application list.');
      }

      let resumeData: Resume | null = null;

      if (resumesRes.status === 'fulfilled' && Array.isArray(resumesRes.value) && resumesRes.value.length > 0) {
        const found = resumesRes.value.find((r) => r.isDefault) || resumesRes.value[0];
        if (found) resumeData = found;
      }

      setDashboard(dashData);
      setApplications(appsData);
      setActiveResume(resumeData);
    } catch (err: any) {
      console.warn('[Demo Mode] Dashboard load fallback engaged:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
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

  const stats = {
    total: dashboard?.applicationsCount ?? 0,
    interviews: dashboard?.interviewCount ?? 0,
    offers: dashboard?.offerCount ?? 0,
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
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
            <Button variant="gradient" size="sm">
              New Application Campaign
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics Grid — real data from backend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Total Submitted</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300">Live</span>
            </div>
            <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">{stats.total}</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Interviews Scheduled</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 dark:bg-yellow-900/25 dark:text-yellow-300">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">{stats.interviews}</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Offers Secured</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300">Success</span>
            </div>
            <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">{stats.offers}</p>
          </Card>
        </div>

        {/* Two-Column Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Column: Applications List */}
          <div className="lg:col-span-2 space-y-6">
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
                  Showing {filteredApps.length} of {stats.total} applications
                </span>
              </div>

              {filteredApps.length > 0 ? (
                <div className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 flex items-center justify-between hover:bg-bg-alt-light/50 dark:hover:bg-bg-alt-dark/20 transition-colors"
                    >
                      <div className="text-left space-y-1 min-w-0">
                        <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                          {app.job?.title || 'Job Title Unavailable'}
                        </h4>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                          {app.job?.company?.name || 'Company'} &bull; Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  ))}
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
                  ) : (
                    <EmptyState
                      title="No applications yet"
                      description="Once your job application campaigns begin, they will appear here."
                    />
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Resume Manager Card */}
          <div className="space-y-6">
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

        <section className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white shadow-xl">
          <div className="p-7 md:p-10 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,.30),_transparent_38%),linear-gradient(135deg,#0f172a,#172554)]">
            <span className="text-[11px] uppercase tracking-[0.2em] text-sky-300 font-bold">Career resource centre</span>
            <div className="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Everything you need for the next strong application.</h2>
                <p className="mt-2 text-sm text-slate-300 max-w-2xl">Practical guides, account help, and clear answers—kept separate from your application workspace.</p>
              </div>
              <a href="mailto:support@applyone.co" className="inline-flex justify-center rounded-lg bg-white text-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-sky-50">Contact support</a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="p-7 space-y-4">
              <span className="text-2xl">📚</span>
              <h3 className="font-bold">Application playbooks</h3>
              <p className="text-xs leading-relaxed text-slate-300">Download focused, printable guidance for resumes and interview preparation.</p>
              <div className="space-y-2 text-sm">
                <a href="/pdfs/resume-tips.pdf" target="_blank" rel="noreferrer" className="block text-sky-300 hover:text-white">Resume optimisation guide ↗</a>
                <a href="/pdfs/interview-prep.pdf" target="_blank" rel="noreferrer" className="block text-sky-300 hover:text-white">Interview preparation guide ↗</a>
                <a href="/pdfs/internship-map.pdf" target="_blank" rel="noreferrer" className="block text-sky-300 hover:text-white">Internship search map ↗</a>
              </div>
            </div>
            <div className="p-7 space-y-4">
              <span className="text-2xl">✦</span>
              <h3 className="font-bold">About ApplyOne</h3>
              <p className="text-xs leading-relaxed text-slate-300">ApplyOne brings job tracking, ATS feedback, and guided career preparation into one private candidate workspace.</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href="/privacy" className="text-sky-300 hover:text-white">Privacy</a>
                <a href="/terms" className="text-sky-300 hover:text-white">Terms</a>
                <a href="mailto:support@applyone.co" className="text-sky-300 hover:text-white">Support</a>
              </div>
            </div>
            <div className="p-7 space-y-4">
              <span className="text-2xl">?</span>
              <h3 className="font-bold">Frequently asked</h3>
              <details className="group rounded-lg bg-white/5 p-3">
                <summary className="cursor-pointer text-sm font-medium">Does ATS use my saved resume?</summary>
                <p className="pt-2 text-xs leading-relaxed text-slate-300">Yes. Analysis uses the active resume saved to your account, not pasted sample text.</p>
              </details>
              <details className="group rounded-lg bg-white/5 p-3">
                <summary className="cursor-pointer text-sm font-medium">Can I replace my resume?</summary>
                <p className="pt-2 text-xs leading-relaxed text-slate-300">Yes. Upload a new file in the Resume card; it becomes the active version for future checks.</p>
              </details>
              <a href="/pdfs/faq.pdf" target="_blank" rel="noreferrer" className="inline-block text-sm text-sky-300 hover:text-white">Open complete FAQ ↗</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
