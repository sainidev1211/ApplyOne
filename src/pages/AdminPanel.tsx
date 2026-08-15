import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import {
  MockUser,
  MockNotification,
  MockPayment,
  MockSupportTicket,
  INITIAL_MOCK_USERS,
  INITIAL_MOCK_NOTIFICATIONS,
  INITIAL_MOCK_PAYMENTS,
  INITIAL_MOCK_TICKETS,
} from '@/features/admin/mockData';

type TabType = 'users' | 'notifications' | 'payments' | 'tickets';

export default function AdminPanel() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // In-memory state for mock data
  const [users, setUsers] = useState<MockUser[]>(INITIAL_MOCK_USERS);
  const [notifications, setNotifications] = useState<MockNotification[]>(INITIAL_MOCK_NOTIFICATIONS);
  const [payments] = useState<MockPayment[]>(INITIAL_MOCK_PAYMENTS);
  const [tickets, setTickets] = useState<MockSupportTicket[]>(INITIAL_MOCK_TICKETS);

  // Users tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  // User Edit Form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPlan, setEditPlan] = useState<MockUser['plan']>('Free');
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<MockUser['status']>('Active');
  const [editResumeStatus, setEditResumeStatus] = useState<MockUser['resumeStatus']>('Uploaded');

  // Notification form state
  const [notifTarget, setNotifTarget] = useState('ALL');
  const [notifMessage, setNotifMessage] = useState('');

  // Handle open edit user modal
  const handleEditUser = (user: MockUser) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPlan(user.plan);
    setEditCredits(user.credits);
    setEditStatus(user.status);
    setEditResumeStatus(user.resumeStatus);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              name: editName,
              email: editEmail,
              plan: editPlan,
              credits: editCredits,
              status: editStatus,
              resumeStatus: editResumeStatus,
            }
          : u
      )
    );

    toast.success(`User "${editName}" updated successfully (In-Memory).`);
    setSelectedUser(null);
  };

  // Notification handler
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) {
      toast.error('Please enter a notification message.');
      return;
    }

    const targetUserObj = users.find((u) => u.id === notifTarget);
    const targetName = notifTarget === 'ALL' ? 'All Users' : targetUserObj ? targetUserObj.name : 'Unknown User';

    const newNotif: MockNotification = {
      id: `notif-${Date.now()}`,
      targetUserId: notifTarget,
      targetUserName: targetName,
      message: notifMessage.trim(),
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setNotifMessage('');
    toast.success(`Notification sent to ${targetName}.`);
  };

  // Support ticket resolution
  const handleToggleTicketStatus = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const nextStatus = t.status === 'open' ? 'resolved' : 'open';
          toast.info(`Ticket marked as ${nextStatus}.`);
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // Filtering users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'ALL' || u.plan === planFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 4. DEMO DATA Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">DEMO DATA — Not connected to database</h4>
            <p className="text-xs opacity-90">
              Changes in this admin panel update in-memory local state. Data will reset upon page refresh.
            </p>
          </div>
        </div>
        <Badge variant="warning" className="hidden sm:inline-flex">
          Mock / Dev Mode
        </Badge>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Admin Control Center
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Logged in as <span className="font-semibold text-primary">{profile?.email || 'admin@applyone.test'}</span> (Role: ADMIN)
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-bg-alt-light dark:bg-bg-alt-dark p-1 rounded-xl border border-border-light dark:border-border-dark self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-card-dark text-primary shadow-sm font-semibold'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-card-dark text-primary shadow-sm font-semibold'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
            }`}
          >
            🔔 Notifications
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white dark:bg-card-dark text-primary shadow-sm font-semibold'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
            }`}
          >
            💳 Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-white dark:bg-card-dark text-primary shadow-sm font-semibold'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
            }`}
          >
            🎧 Support ({tickets.filter((t) => t.status === 'open').length} Open)
          </button>
        </div>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Search, view details, and manage platform user accounts</CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Input
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64"
                />

                <Select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Plans' },
                    { value: 'Free', label: 'Free' },
                    { value: 'Student', label: 'Student' },
                    { value: 'Professional', label: 'Professional' },
                    { value: 'Enterprise', label: 'Enterprise' },
                  ]}
                  className="w-full sm:w-36"
                />

                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Suspended', label: 'Suspended' },
                  ]}
                  className="w-full sm:w-36"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-alt-light dark:bg-bg-alt-dark text-xs uppercase text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Credits</th>
                    <th className="px-6 py-3">Account Status</th>
                    <th className="px-6 py-3">Resume Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                        No users match the selected search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-bg-alt-light/50 dark:hover:bg-bg-alt-dark/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                            {user.name}
                          </div>
                          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              user.plan === 'Enterprise'
                                ? 'primary'
                                : user.plan === 'Professional'
                                ? 'accent'
                                : user.plan === 'Student'
                                ? 'info'
                                : 'gray'
                            }
                          >
                            {user.plan}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-text-primary-light dark:text-text-primary-dark">
                          {user.credits}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              user.status === 'Active'
                                ? 'success'
                                : user.status === 'Pending'
                                ? 'warning'
                                : 'gray'
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                            {user.resumeStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                            ✏️ Edit Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* USER DETAIL EDIT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Edit User Profile</CardTitle>
                <CardDescription>ID: {selectedUser.id}</CardDescription>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>

            <form onSubmit={handleSaveUser}>
              <CardContent className="space-y-4">
                <Input
                  label="Full Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Subscription Plan"
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as MockUser['plan'])}
                    options={[
                      { value: 'Free', label: 'Free' },
                      { value: 'Student', label: 'Student' },
                      { value: 'Professional', label: 'Professional' },
                      { value: 'Enterprise', label: 'Enterprise' },
                    ]}
                  />
                  <Input
                    label="Credits Remaining"
                    type="number"
                    value={editCredits}
                    onChange={(e) => setEditCredits(parseInt(e.target.value, 10) || 0)}
                    min={0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Account Status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as MockUser['status'])}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Suspended', label: 'Suspended' },
                    ]}
                  />
                  <Select
                    label="Resume Status"
                    value={editResumeStatus}
                    onChange={(e) => setEditResumeStatus(e.target.value as MockUser['resumeStatus'])}
                    options={[
                      { value: 'Uploaded', label: 'Uploaded' },
                      { value: 'Under Review', label: 'Under Review' },
                      { value: 'Verified', label: 'Verified' },
                      { value: 'Rejected', label: 'Rejected' },
                    ]}
                  />
                </div>
              </CardContent>

              <div className="px-6 py-4 bg-bg-alt-light dark:bg-bg-alt-dark border-t border-border-light dark:border-border-dark flex justify-end gap-3 rounded-b-xl">
                <Button variant="outline" type="button" onClick={() => setSelectedUser(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose & Dispatch Notification</CardTitle>
              <CardDescription>Send targeted broadcast messages or direct system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4 max-w-2xl">
                <Select
                  label="Target Recipient"
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value)}
                  options={[
                    { value: 'ALL', label: '📢 All Users (Broadcast)' },
                    ...users.map((u) => ({ value: u.id, label: `👤 ${u.name} (${u.email})` })),
                  ]}
                />

                <TextArea
                  label="Notification Message"
                  placeholder="Enter message content to dispatch to recipient..."
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  required
                />

                <Button type="submit" variant="primary">
                  🚀 Dispatch Notification
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sent Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications Log</CardTitle>
              <CardDescription>In-memory record of system notifications dispatched during this session</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-alt-light dark:bg-bg-alt-dark text-xs uppercase text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-6 text-center text-text-secondary-light dark:text-text-secondary-dark">
                        No notifications sent yet.
                      </td>
                    </tr>
                  ) : (
                    notifications.map((notif) => (
                      <tr key={notif.id} className="hover:bg-bg-alt-light/50 dark:hover:bg-bg-alt-dark/50">
                        <td className="px-6 py-4 text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap">
                          {notif.sentAt}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={notif.targetUserId === 'ALL' ? 'accent' : 'info'}>
                            {notif.targetUserName}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text-primary-light dark:text-text-primary-dark">
                          {notif.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment & Billing Records</CardTitle>
            <CardDescription>Mock billing history and subscription transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-alt-light dark:bg-bg-alt-dark text-xs uppercase text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-alt-light/50 dark:hover:bg-bg-alt-dark/50">
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {p.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">{p.userName}</div>
                      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{p.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {p.amount}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
                      {p.date}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          p.status === 'success' ? 'success' : p.status === 'failed' ? 'warning' : 'gray'
                        }
                      >
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: COMPLAINTS / SUPPORT */}
      {activeTab === 'tickets' && (
        <Card>
          <CardHeader>
            <CardTitle>Support & Complaint Tickets</CardTitle>
            <CardDescription>Manage user issues, inquiries, and resolution status</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-alt-light dark:bg-bg-alt-dark text-xs uppercase text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th className="px-6 py-3">Ticket ID</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-bg-alt-light/50 dark:hover:bg-bg-alt-dark/50">
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {t.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">{t.userName}</div>
                      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{t.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-text-primary-light dark:text-text-primary-dark max-w-md font-medium">
                      {t.subject}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
                      {t.createdAt}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={t.status === 'open' ? 'warning' : 'success'}>
                        {t.status === 'open' ? 'OPEN' : 'RESOLVED'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant={t.status === 'open' ? 'primary' : 'outline'}
                        onClick={() => handleToggleTicketStatus(t.id)}
                      >
                        {t.status === 'open' ? 'Mark Resolved' : 'Re-open Ticket'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
