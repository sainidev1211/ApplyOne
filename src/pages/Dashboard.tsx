import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { toast } from '@/store/toastStore';

interface MockJobApplication {
  id: string;
  company: string;
  role: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected';
  appliedDate: string;
}

const mockApplications: MockJobApplication[] = [
  { id: '1', company: 'Stripe', role: 'Software Engineer (Frontend)', status: 'interviewing', appliedDate: '2026-07-10' },
  { id: '2', company: 'Linear', role: 'Product Designer', status: 'applied', appliedDate: '2026-07-12' },
  { id: '3', company: 'Vercel', role: 'Solutions Architect', status: 'offered', appliedDate: '2026-07-05' },
  { id: '4', company: 'Clerk', role: 'Developer Advocate', status: 'rejected', appliedDate: '2026-06-28' },
];

export default function Dashboard() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorSimulated, setErrorSimulated] = useState(false);

  // Mock skeleton loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const [activeResumeUrl, setActiveResumeUrl] = useState(
    profile?.resume_url || 'https://storage.applyone.co/resumes/resume_candidate_user.pdf'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [localResumeError, setLocalResumeError] = useState<string | null>(null);

  // Sync state if profile changes
  useEffect(() => {
    if (profile?.resume_url) {
      setActiveResumeUrl(profile.resume_url);
    }
  }, [profile]);

  const getResumeFileName = (url: string | null | undefined) => {
    if (!url) return 'no_resume_uploaded.pdf';
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return 'my_resume.pdf';
    }
  };

  const handleResumeFileSelected = (file: File) => {
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
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

    // Simulate upload delay
    setTimeout(() => {
      setUploadingResume(false);
      const simulatedUrl = `https://storage.applyone.co/resumes/${encodeURIComponent(file.name)}`;
      setActiveResumeUrl(simulatedUrl);
      toast.success(`Successfully updated resume to: ${file.name}`, 'Resume Updated');
    }, 1500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleResumeFileSelected(files[0]);
    }
  };

  const filteredApps = mockApplications.filter((app) =>
    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: MockJobApplication['status']) => {
    switch (status) {
      case 'applied':
        return <Badge variant="primary">Applied</Badge>;
      case 'interviewing':
        return <Badge variant="warning">Interviewing</Badge>;
      case 'offered':
        return <Badge variant="success">Offered</Badge>;
      case 'rejected':
        return <Badge variant="gray">Archived</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SEO title="Dashboard Loading" />
        <PageSkeleton />
      </div>
    );
  }

  if (errorSimulated) {
    return (
      <div className="py-12">
        <ErrorState
          title="Data Synchronization Error"
          message="Failed to retrieve live logs from Supabase server due to network disruption. Please verify connection credentials."
          retryText="Reconnect Database"
          onRetry={() => {
            setLoading(true);
            setErrorSimulated(false);
            setTimeout(() => setLoading(false), 500);
          }}
        />
      </div>
    );
  }

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
              Active application campaigns for profile: <span className="font-semibold">{profile?.full_name} ({profile?.account_type})</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setErrorSimulated(true)}
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50"
            >
              Simulate Error
            </Button>
            <Button variant="gradient" size="sm">
              New Application Campaign
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Total Submitted</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300">Live</span>
            </div>
            <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">
              {mockApplications.length}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Interviews Scheduled</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 dark:bg-yellow-900/25 dark:text-yellow-300">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">
              {mockApplications.filter((a) => a.status === 'interviewing').length}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Offers Secured</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300">Success</span>
            </div>
            <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">
              {mockApplications.filter((a) => a.status === 'offered').length}
            </p>
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
                  Showing {filteredApps.length} applications
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
                          {app.role}
                        </h4>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                          {app.company} &bull; Applied {app.appliedDate}
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
                  <EmptyState
                    title="No applications found"
                    description={`No active application matches your search query: "${searchQuery}"`}
                    actionText="Clear Filter"
                    onAction={() => setSearchQuery('')}
                  />
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
                </div>
                <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  My Resume
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 leading-relaxed">
                  Your resume matches listings dynamically to evaluate ATS compliance.
                </p>

                {/* Current Resume details */}
                <div className="mt-5 p-3 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-bg-dark flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl flex-shrink-0">📄</span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate block">
                        {getResumeFileName(activeResumeUrl)}
                      </span>
                      <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block">
                        Active matching resume
                      </span>
                    </div>
                  </div>
                  <a
                    href={activeResumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-white dark:hover:bg-card-dark text-text-primary-light dark:text-text-primary-dark transition-colors flex-shrink-0 cursor-pointer"
                    title="Open Resume"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

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
                      if (files && files.length > 0) {
                        handleResumeFileSelected(files[0]);
                      }
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
                        Drag new file or click here
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
          </div>

        </div>
      </div>
    </>
  );
}
