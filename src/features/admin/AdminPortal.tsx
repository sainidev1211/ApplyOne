import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminClient, AdminUser, AdminDashboardMetrics, AdminApplication } from '@/services/api/adminClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import {
  Users,
  FileText,
  Bell,
  Sliders,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Send,
  Sparkles,
  ArrowLeft,
  UserCheck,
  Shield,
  Layers,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  Activity,
  LogOut,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Plus,
  Upload,
  Archive,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'edit-user' | 'push-dashboard' | 'applications' | 'notifications';

const APPLICATION_STATUSES = ['Preparing', 'Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer', 'Accepted', 'Rejected', 'Withdrawn'];

export default function AdminPortal() {
  const { profile, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Loading and metrics state
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);

  // Users listing state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('ALL');
  const [resumeFilter, setResumeFilter] = useState('ALL');

  // Selected user for editing & dashboard pushing
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [managedApplications, setManagedApplications] = useState<AdminApplication[]>([]);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('ALL');
  const [applicationSaving, setApplicationSaving] = useState(false);
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const blankApplication = () => ({ jobTitle: '', company: '', location: '', jobType: 'Full-time', jobUrl: '', jobReference: '', salary: '', status: 'Applied', appliedDate: new Date().toISOString().slice(0, 10), source: 'ApplyOne', campaign: '', notes: '', recruiterContact: '' });
  const [applicationForm, setApplicationForm] = useState(blankApplication);

  // Form State for User Editor
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    accountType: 'STUDENT',
    role: 'USER',
    hasExperience: false,
    companyName: '',
    roleDetails: '',
    expectedPackageFullTime: '',
    expectedPackagePartTime: '',
    expectedPackageInternship: '',
    lastMonthlyPackage: '',
    isActive: true,
    isVerified: true,
    adminNotes: '',
    newPassword: '',
  });

  // Form State for Dashboard Pushing
  const [dashboardPushData, setDashboardPushData] = useState({
    currentPlan: 'Free',
    jobCredits: 10,
    aiCredits: 5,
    resumeCredits: 3,
    atsCredits: 5,
    jobsInProgress: 0,
    adminMessage: '',
    applications: '0',
    responses: '0',
    interviews: '0',
    offers: '0',
    rejected: '0',
    shortlisted: '0',
  });

  // Form State for Notification Broadcaster
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'SINGLE'>('ALL');
  const [targetUserId, setTargetUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('INFO');
  const [notifLink, setNotifLink] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await adminClient.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
    }
  }, []);

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminClient.getUsers({
        page,
        limit: 25,
        search: searchQuery,
        accountType: accountTypeFilter !== 'ALL' ? accountTypeFilter : undefined,
        hasResume: resumeFilter === 'WITH_RESUME' ? 'true' : undefined,
      });
      setUsers(res.items);
      setTotalUsers(res.meta.total);
    } catch (err: any) {
      toast.error('Error fetching users', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, accountTypeFilter, resumeFilter]);

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
  }, [fetchMetrics, fetchUsers]);

  // Select user and populate edit & dashboard form
  const fetchManagedApplications = useCallback(async (userId: string) => {
    try {
      const res = await adminClient.getApplications(userId, { search: applicationSearch, status: applicationStatusFilter !== 'ALL' ? applicationStatusFilter : undefined, limit: 100 });
      setManagedApplications(res.items);
    } catch (err: any) {
      toast.error('Unable to load applications', err.message);
    }
  }, [applicationSearch, applicationStatusFilter]);

  const handleSelectUser = (user: AdminUser, targetTab: 'edit-user' | 'push-dashboard' | 'applications' = 'edit-user') => {
    setSelectedUser(user);
    setEditFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      accountType: user.accountType || 'STUDENT',
      role: user.role || 'USER',
      hasExperience: user.hasExperience ?? false,
      companyName: user.companyName || '',
      roleDetails: user.roleDetails || '',
      expectedPackageFullTime: user.expectedPackageFullTime || '',
      expectedPackagePartTime: user.expectedPackagePartTime || '',
      expectedPackageInternship: user.expectedPackageInternship || '',
      lastMonthlyPackage: user.lastMonthlyPackage || '',
      isActive: user.isActive ?? true,
      isVerified: user.isVerified ?? true,
      adminNotes: user.adminNotes || '',
      newPassword: '',
    });

    const db = user.dashboardData || {};
    const creds = db.remainingCredits || {};
    const storedMetrics = db.dashboardMetrics || {};
    setDashboardPushData({
      currentPlan: db.currentPlan || 'Free',
      jobCredits: creds.job ?? 10,
      aiCredits: creds.ai ?? 5,
      resumeCredits: creds.resume ?? 3,
      atsCredits: creds.ats ?? 5,
      jobsInProgress: db.jobsInProgress ?? 0,
      adminMessage: db.adminMessage || '',
      applications: String(storedMetrics.applications ?? db.applicationsCount ?? '0'),
      responses: String(storedMetrics.responses ?? '0'),
      interviews: String(storedMetrics.interviews ?? db.interviewCount ?? '0'),
      offers: String(storedMetrics.offers ?? db.offerCount ?? '0'),
      rejected: String(storedMetrics.rejected ?? '0'),
      shortlisted: String(storedMetrics.shortlisted ?? '0'),
    });

    setTargetUserId(user.id);
    setActiveTab(targetTab);
    if (targetTab === 'applications') void fetchManagedApplications(user.id);
  };

  useEffect(() => {
    if (activeTab === 'applications' && selectedUser) void fetchManagedApplications(selectedUser.id);
  }, [activeTab, selectedUser?.id, fetchManagedApplications]);

  const saveApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;
    if (!applicationForm.jobTitle.trim() || !applicationForm.company.trim() || !applicationForm.status || !applicationForm.appliedDate) {
      toast.error('Missing required fields', 'User, job title, company, status, and applied date are required.');
      return;
    }
    setApplicationSaving(true);
    try {
      if (editingApplicationId) {
        await adminClient.updateApplication(selectedUser.id, editingApplicationId, applicationForm);
        toast.success('Application updated successfully');
      } else {
        await adminClient.createApplication(selectedUser.id, applicationForm);
        toast.success('Application added successfully');
      }
      setApplicationForm(blankApplication());
      setEditingApplicationId(null);
      await fetchManagedApplications(selectedUser.id);
      await fetchUsers();
    } catch (err: any) {
      toast.error('Unable to save application', err.message);
    } finally { setApplicationSaving(false); }
  };

  const editApplication = (application: AdminApplication) => {
    setEditingApplicationId(application.id);
    setApplicationForm({ ...blankApplication(), ...application, appliedDate: application.appliedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const archiveApplication = async (application: AdminApplication) => {
    if (!selectedUser || !window.confirm(`Archive ${application.jobTitle} at ${application.company}? This cannot be undone.`)) return;
    try {
      await adminClient.deleteApplication(selectedUser.id, application.id);
      toast.success('Application archived');
      await fetchManagedApplications(selectedUser.id);
    } catch (err: any) { toast.error('Unable to archive application', err.message); }
  };

  const importCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser) return;
    const text = await file.text();
    const [header, ...rows] = text.trim().split(/\r?\n/);
    const columns = header.split(',').map((value) => value.trim());
    const applications = rows.filter(Boolean).map((row) => Object.fromEntries(row.split(',').map((value, index) => [columns[index], value.trim()])));
    if (!applications.length) { toast.error('No importable rows found'); return; }
    setApplicationSaving(true);
    try {
      const result = await adminClient.bulkCreateApplications(selectedUser.id, applications);
      toast.success(`${result.created} applications imported`, result.skipped ? `${result.skipped} incomplete rows skipped.` : undefined);
      await fetchManagedApplications(selectedUser.id);
    } catch (err: any) { toast.error('CSV import failed', err.message); }
    finally { setApplicationSaving(false); event.target.value = ''; }
  };

  // Submit User Profile Updates
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      const updated = await adminClient.updateUser(selectedUser.id, editFormData);
      toast.success('User Updated', `Successfully updated profile for ${updated.fullName || updated.email}`);
      setSelectedUser(updated);
      fetchUsers();
      fetchMetrics();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Push to Dashboard
  const handlePushDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      await adminClient.updateDashboard(selectedUser.id, {
        currentPlan: dashboardPushData.currentPlan,
        remainingCredits: {
          job: Number(dashboardPushData.jobCredits),
          ai: Number(dashboardPushData.aiCredits),
          resume: Number(dashboardPushData.resumeCredits),
          ats: Number(dashboardPushData.atsCredits),
        },
        jobsInProgress: Number(dashboardPushData.jobsInProgress),
        adminMessage: dashboardPushData.adminMessage.trim(),
        dashboardMetrics: {
          applications: dashboardPushData.applications,
          responses: dashboardPushData.responses,
          interviews: dashboardPushData.interviews,
          offers: dashboardPushData.offers,
          rejected: dashboardPushData.rejected,
          shortlisted: dashboardPushData.shortlisted,
        },
      });

      toast.success('Dashboard Pushed', `User ${selectedUser.email}'s dashboard has been updated live in MongoDB.`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Push Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Notification Broadcast / Direct Send
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error('Missing fields', 'Title and message are required.');
      return;
    }

    setSendingNotif(true);
    try {
      if (notifTarget === 'ALL') {
        const res = await adminClient.broadcastNotification({
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          link: notifLink.trim() || undefined,
        });
        toast.success('Broadcast Sent', res.message || 'Notification broadcasted to all users.');
      } else {
        if (!targetUserId) {
          toast.error('Missing user', 'Please select or enter target user ID/email.');
          setSendingNotif(false);
          return;
        }
        await adminClient.sendUserNotification(targetUserId, {
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          link: notifLink.trim() || undefined,
        });
        toast.success('Notification Sent', `Notification delivered to ${targetUserId}.`);
      }

      setNotifTitle('');
      setNotifMessage('');
      setNotifLink('');
    } catch (err: any) {
      toast.error('Dispatch Error', err.message);
    } finally {
      setSendingNotif(false);
    }
  };

  const formatAdminDate = (value?: string | Date | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const formatAdminCurrency = (amount?: number | string | null, currency = 'INR') => {
    if (amount === null || amount === undefined || amount === '') return '—';
    const numeric = Number(amount);
    if (Number.isNaN(numeric)) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(numeric);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Executive Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ApplyOne" className="w-8 h-8 rounded-lg object-contain" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight leading-none">
                  Apply<span className="text-cyan-400">One</span>
                </span>
                <span className="bg-blue-900/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Company Admin
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Unified MongoDB Management Engine
              </span>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Users Directory ({totalUsers})
          </button>
          <button
            onClick={() => {
              if (!selectedUser && users.length > 0) handleSelectUser(users[0], 'edit-user');
              else setActiveTab('edit-user');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'edit-user'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> User Form Editor
          </button>
          <button
            onClick={() => {
              if (!selectedUser && users.length > 0) handleSelectUser(users[0], 'push-dashboard');
              else setActiveTab('push-dashboard');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'push-dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Push to Dashboard
          </button>
          <button
            onClick={() => {
              if (!selectedUser && users.length > 0) handleSelectUser(users[0], 'applications');
              else setActiveTab('applications');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'applications' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Applications
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Notifications
          </button>
        </div>

        {/* Admin info & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{profile?.full_name || 'Admin'}</div>
            <div className="text-[10px] text-cyan-400">{profile?.email || 'admin@applyone.co'}</div>
          </div>
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="h-8 px-2.5 text-xs border-slate-700 bg-slate-800/60 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 text-slate-300 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-cyan-400" /> Company Operations & Insights
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Live MongoDB metrics for user accounts, resumes, subscriptions, and dispatch pipelines.
                </p>
              </div>
              <Button
                onClick={() => {
                  fetchMetrics();
                  fetchUsers();
                  toast.success('Refreshed', 'Database metrics updated.');
                }}
                variant="outline"
                className="border-slate-700 bg-slate-800/80 text-xs text-slate-200 hover:text-white gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
              </Button>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-900/80 border-slate-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
                    <div className="text-3xl font-extrabold text-white mt-1.5">
                      {metrics?.overview.totalUsers ?? totalUsers}
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" /> Live in MongoDB
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users</span>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-1.5">
                      {metrics?.overview.activeUsers ?? totalUsers}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                      Verified & Active
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resumes Stored</span>
                    <div className="text-3xl font-extrabold text-cyan-400 mt-1.5">
                      {metrics?.overview.usersWithResumes ?? 0}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                      Ready for Matching
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <FileText className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students / Freshers</span>
                    <div className="text-3xl font-extrabold text-purple-400 mt-1.5">
                      {(metrics?.overview.studentsCount ?? 0) + (metrics?.overview.freshersCount ?? 0)}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                      {metrics?.overview.professionalsCount ?? 0} Professionals
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Layers className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Active Subscribers', metrics?.overview.activeSubscribers ?? 0, 'text-emerald-400'],
                ['Applications Submitted', metrics?.overview.applicationsSubmitted ?? 0, 'text-blue-400'],
                ['Interviews', metrics?.overview.interviews ?? 0, 'text-orange-400'],
                ['Offers', metrics?.overview.offers ?? 0, 'text-purple-400'],
              ].map(([label, value, color]) => <Card key={String(label)} className="bg-slate-900/80 border-slate-800"><CardContent className="p-4"><p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">{label}</p><p className={`mt-1 text-2xl font-extrabold ${color}`}>{Number(value).toLocaleString()}</p><p className="mt-1 text-[11px] text-slate-500">Derived from persisted records</p></CardContent></Card>)}
            </div>

            {/* Quick Actions & Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Admin Actions */}
              <Card className="bg-slate-900/80 border-slate-800 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Executive Quick Actions
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Frequently performed administrative functions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <Button
                    onClick={() => setActiveTab('users')}
                    className="w-full justify-between bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs h-10 border border-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" /> View & Manage All Users
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button
                    onClick={() => setActiveTab('notifications')}
                    className="w-full justify-between bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs h-10 border border-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" /> Send Broadcast Announcement
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button
                    onClick={() => {
                      if (users.length > 0) handleSelectUser(users[0], 'push-dashboard');
                      else setActiveTab('push-dashboard');
                    }}
                    className="w-full justify-between bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs h-10 border border-slate-700/60"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" /> Push Dashboard Credits & Plans
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Registrations */}
              <Card className="bg-slate-900/80 border-slate-800 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" /> Recent Registrations
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Latest candidates signed up on the platform.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setActiveTab('users')}
                    variant="ghost"
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    View All →
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-800/80">
                    {(metrics?.recentUsers || users.slice(0, 5)).map((u) => (
                      <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-300">
                            {u.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-200">{u.fullName || 'Unnamed'}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="gray" className="text-[10px]">
                            {u.accountType}
                          </Badge>
                          {(Boolean((u as any).hasResume) || Boolean((u as any).resumeFileName)) && (
                            <Badge variant="info" className="text-[10px]">
                              Resume ✓
                            </Badge>
                          )}
                          <Button
                            onClick={() => {
                              const found = users.find((x) => x.id === u.id) || (u as any);
                              handleSelectUser(found);
                            }}
                            variant="outline"
                            className="h-7 text-xs px-2 border-slate-700 text-slate-300 hover:text-white"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: USERS DIRECTORY & RESUME HUB */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" /> Candidates & User Accounts ({totalUsers})
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Complete candidate database stored in MongoDB with downloadable resumes.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, email, phone..."
                    className="pl-9 h-9 bg-slate-900 border-slate-800 text-xs text-white placeholder-slate-500"
                  />
                </div>

                <select
                  value={accountTypeFilter}
                  onChange={(e) => {
                    setAccountTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 bg-slate-900 border-slate-800 text-xs text-white"
                >
                  <option value="ALL">All Types</option>
                  <option value="STUDENT">Students</option>
                  <option value="FRESHER">Freshers</option>
                  <option value="PROFESSIONAL">Professionals</option>
                </select>

                <select
                  value={resumeFilter}
                  onChange={(e) => {
                    setResumeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 bg-slate-900 border-slate-800 text-xs text-white"
                >
                  <option value="ALL">All Resumes</option>
                  <option value="WITH_RESUME">With Resume</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <Card className="bg-slate-900/90 border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3.5">Candidate</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Type & Role</th>
                      <th className="p-3.5">Experience & Target</th>
                      <th className="p-3.5">Resume File</th>
                      <th className="p-3.5">Plan & Billing</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          Loading candidate data from MongoDB...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          No candidate records match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-medium text-slate-200">
                            <div className="font-bold text-white">{u.fullName || 'Unnamed'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            <div>{u.phone || 'No phone'}</div>
                            <div className="text-[10px] text-slate-500">
                              Joined {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant="primary" className="text-[10px]">
                                {u.accountType}
                              </Badge>
                              {u.role === 'ADMIN' && (
                                <Badge variant="secondary" className="text-[9px]">Admin</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            <div>{u.hasExperience ? `${u.companyName || 'Experienced'}` : 'No Experience'}</div>
                            <div className="text-[10px] text-slate-400">
                              {u.expectedPackageFullTime ? `Pkg: ${u.expectedPackageFullTime}` : 'Package not set'}
                            </div>
                          </td>
                          <td className="p-3.5">
                            {u.resumePath || u.resumeFileName || (u.resumesCount ?? 0) > 0 ? (
                              <a
                                href={adminClient.getResumeDownloadUrl(u.resumePath, u.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{u.resumeFileName || 'Download'}</span>
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[11px]">No resume</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-300">
                            <div className="font-semibold text-white text-[11px]">
                              {u.subscriptionInfo?.planName || u.dashboardData?.currentPlan || 'Free'}
                            </div>
                            <div className="text-[10px] text-cyan-300 mt-1">
                              {formatAdminCurrency(u.subscriptionInfo?.amount ?? u.paymentInfo?.amount, u.subscriptionInfo?.currency || u.paymentInfo?.currency || 'INR')}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Start: {formatAdminDate(u.subscriptionInfo?.startDate)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Expiry: {formatAdminDate(u.subscriptionInfo?.expiresAt)}
                            </div>
                          </td>
                          <td className="p-3.5">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-400 font-medium text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" /> Blocked
                              </span>
                            )}
                            <div className="mt-1 text-[10px] text-slate-400">
                              {u.paymentInfo?.status === 'SUCCESS' || u.paymentInfo?.status === 'PAID' ? (
                                <span className="text-emerald-400">Paid via {u.paymentInfo?.method || 'DB'}</span>
                              ) : u.paymentInfo?.status === 'PENDING' ? (
                                <span className="text-yellow-400">Payment pending</span>
                              ) : u.paymentInfo?.paymentId ? (
                                <span className="text-cyan-400">Ref: {u.paymentInfo.paymentId}</span>
                              ) : (
                                <span className="text-slate-500">No payment data</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <Button
                              onClick={() => handleSelectUser(u, 'edit-user')}
                              variant="outline"
                              className="h-7 text-[11px] px-2.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                            >
                              <Edit3 className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button
                              onClick={() => handleSelectUser(u, 'push-dashboard')}
                              className="h-7 text-[11px] px-2.5 bg-blue-600 hover:bg-blue-500 text-white"
                            >
                              <Sliders className="w-3 h-3 mr-1" /> Push
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: USER FORM EDITOR */}
        {activeTab === 'edit-user' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-400" /> Form-Based Candidate Editor
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  select any candidate to view all detailed fields and update their MongoDB profile directly.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('users')}
                variant="outline"
                className="h-8 text-xs border-slate-700 text-slate-300 gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
              </Button>
            </div>

            {/* User selector Dropdown if multiple users available */}
            <Card className="bg-slate-900 border-slate-800 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                  selected Candidate:
                </label>
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const found = users.find((u) => u.id === e.target.value);
                    if (found) handleSelectUser(found, 'edit-user');
                  }}
                  className="bg-slate-950 border-slate-800 text-xs text-white flex-1"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.email} ({u.email}) — {u.accountType}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {selectedUser ? (
              <form onSubmit={handleSaveUser}>
                <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                  <CardHeader className="border-b border-slate-800/80 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-base">
                          {editFormData.fullName?.charAt(0) || editFormData.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white font-bold">
                            {editFormData.fullName || selectedUser.email}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-400">
                            MongoDB ID: <span className="font-mono text-cyan-400">{selectedUser.id}</span>
                          </CardDescription>
                        </div>
                      </div>

                      {(selectedUser.resumePath || selectedUser.resumeFileName || (selectedUser.resumes?.length ?? 0) > 0) && (
                        <a
                          href={adminClient.getResumeDownloadUrl(selectedUser.resumePath, selectedUser.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs px-3 py-1.5 rounded-lg font-medium"
                        >
                          <Download className="w-4 h-4" /> Download Resume ({selectedUser.resumeFileName || 'Candidate Resume'})
                        </a>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    {/* Section 1: Core Information */}
                    <div>
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> 1. Core Profile & Contact
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                          <Input
                            value={editFormData.fullName}
                            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                          <Input
                            value={editFormData.email}
                            disabled
                            className="bg-slate-950/50 border-slate-800/50 text-xs text-slate-500 cursor-not-allowed font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                          <Input
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                            placeholder="+91 9876543210"
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Account Role & Classification */}
                    <div className="border-t border-slate-800/80 pt-5">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> 2. Classification & Authorization
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Account Type</label>
                          <select
                            value={editFormData.accountType}
                            onChange={(e) => setEditFormData({ ...editFormData, accountType: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="FRESHER">FRESHER</option>
                            <option value="PROFESSIONAL">PROFESSIONAL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">System Role</label>
                          <select
                            value={editFormData.role}
                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Account State</label>
                          <select
                            value={editFormData.isActive ? 'ACTIVE' : 'BLOCKED'}
                            onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'ACTIVE' })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          >
                            <option value="ACTIVE">Active (Access Allowed)</option>
                            <option value="BLOCKED">Deactivated / Blocked</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Career & Experience Info */}
                    <div className="border-t border-slate-800/80 pt-5">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> 3. Experience & Compensation Targets
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Prior Experience?</label>
                          <select
                            value={editFormData.hasExperience ? 'YES' : 'NO'}
                            onChange={(e) => setEditFormData({ ...editFormData, hasExperience: e.target.value === 'YES' })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          >
                            <option value="NO">No Prior Experience</option>
                            <option value="YES">Yes, Has Experience</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Previous / Current Company</label>
                          <Input
                            value={editFormData.companyName}
                            onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                            placeholder="e.g. Infosys, TCS, Startup"
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Role / Job Title</label>
                          <Input
                            value={editFormData.roleDetails}
                            onChange={(e) => setEditFormData({ ...editFormData, roleDetails: e.target.value })}
                            placeholder="e.g. Frontend Developer"
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Expected Full-Time Package</label>
                          <Input
                            value={editFormData.expectedPackageFullTime}
                            onChange={(e) => setEditFormData({ ...editFormData, expectedPackageFullTime: e.target.value })}
                            placeholder="e.g. ₹12 LPA"
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Expected Internship Stipend</label>
                          <Input
                            value={editFormData.expectedPackageInternship}
                            onChange={(e) => setEditFormData({ ...editFormData, expectedPackageInternship: e.target.value })}
                            placeholder="e.g. ₹35,000 / month"
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Last Monthly Package</label>
                          <Input
                            value={editFormData.lastMonthlyPackage}
                            onChange={(e) => setEditFormData({ ...editFormData, lastMonthlyPackage: e.target.value })}
                            placeholder="e.g. ₹60,000"
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Admin Private Notes & Password Reset */}
                    <div className="border-t border-slate-800/80 pt-5">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" /> 4. Internal Notes & Password Reset
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Internal Admin Notes (Invisible to Candidate)</label>
                          <TextArea
                            rows={3}
                            value={editFormData.adminNotes}
                            onChange={(e) => setEditFormData({ ...editFormData, adminNotes: e.target.value })}
                            placeholder="Candidate interviewed for Tech Lead role, approved for elite dispatch..."
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Force Reset Password (Leave blank to keep current)</label>
                          <Input
                            type="password"
                            value={editFormData.newPassword}
                            onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                            placeholder="New password (min 8 characters)"
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Only fill this if you need to override the candidate&apos;s password immediately.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <Button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        variant="outline"
                        className="border-slate-700 text-xs text-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs h-10 px-6"
                      >
                        {loading ? 'Saving Changes...' : 'Save Candidate Profile to MongoDB'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            ) : (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-500 text-sm">
                Please select a candidate from the directory to start editing.
              </Card>
            )}
          </div>
        )}

        {/* TAB 4: PUSH TO USER DASHBOARD */}
        {activeTab === 'push-dashboard' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" /> Push Live Updates to Candidate Dashboard
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Directly customize any user&apos;s active subscription plan, remaining credits, application counters, and announcement banner.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('users')}
                variant="outline"
                className="h-8 text-xs border-slate-700 text-slate-300 gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
              </Button>
            </div>

            {/* Candidate selector */}
            <Card className="bg-slate-900 border-slate-800 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                  Target Candidate:
                </label>
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const found = users.find((u) => u.id === e.target.value);
                    if (found) handleSelectUser(found, 'push-dashboard');
                  }}
                  className="bg-slate-950 border-slate-800 text-xs text-white flex-1"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.email} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {selectedUser ? (
              <form onSubmit={handlePushDashboard}>
                <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                  <CardHeader className="border-b border-slate-800/80 pb-4">
                    <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> Customizing Dashboard for {selectedUser.fullName || selectedUser.email}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Changes pushed here immediately reflect on the candidate&apos;s dashboard view.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    {/* Plan selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Assigned Subscription Plan
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['Free', 'Professional', 'Premium', 'Elite'].map((plan) => (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => setDashboardPushData({ ...dashboardPushData, currentPlan: plan })}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              dashboardPushData.currentPlan === plan
                                ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="font-bold text-xs">{plan} Tier</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {plan === 'Elite' ? 'Uncapped features' : plan === 'Free' ? 'Base access' : 'Active Matching'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Credit Balances */}
                    <div className="border-t border-slate-800/80 pt-5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                        Remaining Usage Credits
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Daily Job Matches</label>
                          <Input
                            type="number"
                            value={dashboardPushData.jobCredits}
                            onChange={(e) => setDashboardPushData({ ...dashboardPushData, jobCredits: Number(e.target.value) })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">AI Assistant Credits</label>
                          <Input
                            type="number"
                            value={dashboardPushData.aiCredits}
                            onChange={(e) => setDashboardPushData({ ...dashboardPushData, aiCredits: Number(e.target.value) })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Resume Analyses</label>
                          <Input
                            type="number"
                            value={dashboardPushData.resumeCredits}
                            onChange={(e) => setDashboardPushData({ ...dashboardPushData, resumeCredits: Number(e.target.value) })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">ATS Score Checks</label>
                          <Input
                            type="number"
                            value={dashboardPushData.atsCredits}
                            onChange={(e) => setDashboardPushData({ ...dashboardPushData, atsCredits: Number(e.target.value) })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Dashboard Metrics</label>
                      <p className="text-xs text-slate-400 mb-3">These are admin-managed values shown exactly on the candidate dashboard. Application and campaign changes do not alter them.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        {([
                          ['applications', 'Applications Applied'],
                          ['responses', 'Responses'],
                          ['interviews', 'Interviews'],
                          ['offers', 'Offers'],
                          ['rejected', 'Rejected'],
                          ['shortlisted', 'Shortlisted'],
                        ] as const).map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-xs text-slate-400 mb-1">{label}</label>
                            <Input
                              type="text"
                              value={dashboardPushData[key]}
                              onChange={(e) => setDashboardPushData({ ...dashboardPushData, [key]: e.target.value })}
                              className="bg-slate-950 border-slate-800 text-xs text-white"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="max-w-xs">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Jobs In Progress</label>
                          <Input
                            type="number"
                            value={dashboardPushData.jobsInProgress}
                            onChange={(e) => setDashboardPushData({ ...dashboardPushData, jobsInProgress: Number(e.target.value) })}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Admin Announcement Message on Dashboard */}
                    <div className="border-t border-slate-800/80 pt-5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Admin Banner Message (Displayed at top of user dashboard)
                      </label>
                      <Input
                        value={dashboardPushData.adminMessage}
                        onChange={(e) => setDashboardPushData({ ...dashboardPushData, adminMessage: e.target.value })}
                        placeholder="e.g. Your resume has been dispatched to 45 tier-1 companies. Expect recruiter calls this week!"
                        className="bg-slate-950 border-slate-800 text-xs text-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Leave blank to clear any custom banner on their dashboard.
                      </p>
                    </div>

                    {/* Submit Push */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-semibold text-xs h-10 px-6 shadow-lg shadow-emerald-950/60"
                      >
                        {loading ? 'Pushing Updates...' : 'Push Live to Candidate Dashboard'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            ) : (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-500 text-sm">
                Please select a candidate to customize their dashboard.
              </Card>
            )}
          </div>
        )}

        {/* APPLICATION MANAGEMENT */}
        {activeTab === 'applications' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2"><Briefcase className="w-5 h-5 text-cyan-400" /> Application Management</h1>
                <p className="text-slate-400 text-xs mt-0.5">Persisted application records power the candidate dashboard and its metrics.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                <Upload className="w-3.5 h-3.5" /> Import CSV
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} disabled={!selectedUser || applicationSaving} />
              </label>
            </div>

            <Card className="bg-slate-900 border-slate-800 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <select value={selectedUser?.id || ''} onChange={(e) => { const candidate = users.find((u) => u.id === e.target.value); if (candidate) handleSelectUser(candidate, 'applications'); }} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">
                  <option value="">Select a candidate</option>
                  {users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.fullName || candidate.email} — {candidate.email}</option>)}
                </select>
                {selectedUser && <div className="text-xs text-slate-400">{selectedUser.subscriptionInfo?.planName || selectedUser.dashboardData?.currentPlan || 'Free'} plan · {managedApplications.length} applications</div>}
              </div>
            </Card>

            {selectedUser ? <>
              <form onSubmit={saveApplication}>
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                  <CardHeader className="border-b border-slate-800 pb-3"><CardTitle className="text-sm text-white">{editingApplicationId ? 'Edit application' : `Add application for ${selectedUser.fullName || selectedUser.email}`}</CardTitle><CardDescription className="text-xs text-slate-400">Fields marked by the workflow are required. Changes are immediately persisted for the user.</CardDescription></CardHeader>
                  <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                    {([['jobTitle', 'Job title *'], ['company', 'Company *'], ['location', 'Location'], ['jobType', 'Job type'], ['jobUrl', 'Job URL'], ['jobReference', 'Job ID / reference'], ['salary', 'Salary / range'], ['source', 'Application source'], ['campaign', 'Campaign'], ['recruiterContact', 'Recruiter / contact']] as const).map(([key, label]) => <div key={key}><label className="mb-1 block text-[11px] text-slate-400">{label}</label><Input value={applicationForm[key]} onChange={(e) => setApplicationForm({ ...applicationForm, [key]: e.target.value })} className="bg-slate-950 border-slate-800 text-xs text-white" /></div>)}
                    <div><label className="mb-1 block text-[11px] text-slate-400">Status *</label><select value={applicationForm.status} onChange={(e) => setApplicationForm({ ...applicationForm, status: e.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white">{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
                    <div><label className="mb-1 block text-[11px] text-slate-400">Applied date *</label><Input type="date" value={applicationForm.appliedDate} onChange={(e) => setApplicationForm({ ...applicationForm, appliedDate: e.target.value })} className="bg-slate-950 border-slate-800 text-xs text-white" /></div>
                    <div className="sm:col-span-2 lg:col-span-3"><label className="mb-1 block text-[11px] text-slate-400">Notes</label><TextArea value={applicationForm.notes} onChange={(e) => setApplicationForm({ ...applicationForm, notes: e.target.value })} className="min-h-20 bg-slate-950 border-slate-800 text-xs text-white" /></div>
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setApplicationForm(blankApplication()); setEditingApplicationId(null); }} className="border-slate-700 text-xs text-slate-300">Cancel</Button><Button type="submit" disabled={applicationSaving} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-xs">{applicationSaving ? 'Saving…' : editingApplicationId ? 'Save changes' : 'Add application'}</Button></div>
                  </CardContent>
                </Card>
              </form>

              <Card className="overflow-hidden bg-slate-900 border-slate-800">
                <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row"><Input placeholder="Search company, job, campaign" value={applicationSearch} onChange={(e) => setApplicationSearch(e.target.value)} className="bg-slate-950 border-slate-800 text-xs text-white" /><select value={applicationStatusFilter} onChange={(e) => setApplicationStatusFilter(e.target.value)} className="rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white"><option value="ALL">All statuses</option>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-950/70 text-slate-400"><tr><th className="p-3">Job</th><th className="p-3">Company</th><th className="p-3">Status</th><th className="p-3">Applied</th><th className="p-3">Campaign</th><th className="p-3">Updated</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-800">{managedApplications.map((application) => <tr key={application.id} className="text-slate-200"><td className="p-3 font-semibold">{application.jobTitle}</td><td className="p-3">{application.company}</td><td className="p-3"><Badge variant="primary">{application.status}</Badge></td><td className="p-3">{application.appliedDate || '—'}</td><td className="p-3">{application.campaign || '—'}</td><td className="p-3">{application.updatedAt ? new Date(application.updatedAt).toLocaleDateString() : '—'}</td><td className="p-3 whitespace-nowrap"><button onClick={() => editApplication(application)} className="mr-3 text-cyan-400 hover:text-cyan-300">Edit</button><button onClick={() => archiveApplication(application)} className="text-red-400 hover:text-red-300">Archive</button></td></tr>)}{!managedApplications.length && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No applications match this candidate and filter.</td></tr>}</tbody></table></div>
              </Card>
            </> : <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-500 text-sm">Select a candidate to manage their applications.</Card>}
          </div>
        )}

        {/* TAB 5: NOTIFICATION DISPATCHER */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" /> Executive Notification Dispatcher
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Send in-app notifications and announcements to all candidates or targeted individuals.
              </p>
            </div>

            <Card className="bg-slate-900/90 border-slate-800 shadow-xl max-w-2xl">
              <CardHeader className="border-b border-slate-800/80 pb-4">
                <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" /> Create Notification
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Recipients will receive this in their in-app notifications inbox immediately.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Target Audience
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNotifTarget('ALL')}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                          notifTarget === 'ALL'
                            ? 'bg-blue-950/60 border-cyan-500 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Broadcast to ALL Users ({totalUsers})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifTarget('SINGLE')}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                          notifTarget === 'SINGLE'
                            ? 'bg-blue-950/60 border-cyan-500 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Single Candidate
                      </button>
                    </div>
                  </div>

                  {notifTarget === 'SINGLE' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Candidate Email / ID</label>
                      <select
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-xs text-white"
                      >
                        <option value="">select Candidate...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || u.email} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Notification Title</label>
                      <Input
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g. Interview Scheduled with Amazon"
                        required
                        className="bg-slate-950 border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Category / Severity</label>
                      <select
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-xs text-white"
                      >
                        <option value="INFO">General Information</option>
                        <option value="SUCCESS">Success / Interview Invite</option>
                        <option value="WARNING">Action Required</option>
                        <option value="ANNOUNCEMENT">Company Announcement</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notification Message</label>
                    <TextArea
                      rows={4}
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="Write your detailed announcement or alert..."
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Optional Action Link URL</label>
                    <Input
                      value={notifLink}
                      onChange={(e) => setNotifLink(e.target.value)}
                      placeholder="/dashboard/applications or https://..."
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendingNotif}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs h-10 mt-2 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingNotif ? 'Dispatching Notification...' : notifTarget === 'ALL' ? 'Broadcast to All Candidates' : 'Send to Candidate'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
