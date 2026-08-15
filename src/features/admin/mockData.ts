export interface MockUser {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Student' | 'Professional' | 'Enterprise';
  credits: number;
  status: 'Active' | 'Suspended' | 'Pending';
  resumeStatus: 'Uploaded' | 'Under Review' | 'Verified' | 'Rejected';
  createdAt: string;
}

export interface MockNotification {
  id: string;
  targetUserId: string;
  targetUserName: string;
  message: string;
  sentAt: string;
}

export interface MockPayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: string;
  date: string;
  status: 'success' | 'failed' | 'refunded';
}

export interface MockSupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export const INITIAL_MOCK_USERS: MockUser[] = [
  {
    id: 'usr-1',
    name: 'Dev Saini',
    email: 'admin@applyone.test',
    plan: 'Enterprise',
    credits: 500,
    status: 'Active',
    resumeStatus: 'Verified',
    createdAt: '2026-01-10',
  },
  {
    id: 'usr-2',
    name: 'Sarah Connor',
    email: 'sarah.c@cyberdyne.io',
    plan: 'Professional',
    credits: 120,
    status: 'Active',
    resumeStatus: 'Verified',
    createdAt: '2026-02-14',
  },
  {
    id: 'usr-3',
    name: 'Alex Mercer',
    email: 'alex.mercer@gentek.org',
    plan: 'Student',
    credits: 25,
    status: 'Active',
    resumeStatus: 'Under Review',
    createdAt: '2026-03-01',
  },
  {
    id: 'usr-4',
    name: 'Marcus Holloway',
    email: 'marcus@dedsec.net',
    plan: 'Free',
    credits: 5,
    status: 'Pending',
    resumeStatus: 'Uploaded',
    createdAt: '2026-04-12',
  },
  {
    id: 'usr-5',
    name: 'Elena Fisher',
    email: 'elena@journalism.co',
    plan: 'Professional',
    credits: 85,
    status: 'Active',
    resumeStatus: 'Verified',
    createdAt: '2026-05-20',
  },
  {
    id: 'usr-6',
    name: 'Gordon Freeman',
    email: 'gordon@blackmesa.gov',
    plan: 'Free',
    credits: 0,
    status: 'Suspended',
    resumeStatus: 'Rejected',
    createdAt: '2026-06-05',
  },
];

export const INITIAL_MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif-1',
    targetUserId: 'ALL',
    targetUserName: 'All Users',
    message: 'System maintenance scheduled for Sunday at 2:00 AM UTC.',
    sentAt: '2026-07-28 14:30',
  },
  {
    id: 'notif-2',
    targetUserId: 'usr-2',
    targetUserName: 'Sarah Connor',
    message: 'Your resume review feedback has been published.',
    sentAt: '2026-08-01 09:15',
  },
];

export const INITIAL_MOCK_PAYMENTS: MockPayment[] = [
  {
    id: 'pay-101',
    userId: 'usr-1',
    userName: 'Dev Saini',
    userEmail: 'admin@applyone.test',
    amount: '$99.00',
    date: '2026-07-01',
    status: 'success',
  },
  {
    id: 'pay-102',
    userId: 'usr-2',
    userName: 'Sarah Connor',
    userEmail: 'sarah.c@cyberdyne.io',
    amount: '$29.00',
    date: '2026-07-15',
    status: 'success',
  },
  {
    id: 'pay-103',
    userId: 'usr-3',
    userName: 'Alex Mercer',
    userEmail: 'alex.mercer@gentek.org',
    amount: '$15.00',
    date: '2026-07-20',
    status: 'failed',
  },
  {
    id: 'pay-104',
    userId: 'usr-5',
    userName: 'Elena Fisher',
    userEmail: 'elena@journalism.co',
    amount: '$29.00',
    date: '2026-07-25',
    status: 'success',
  },
  {
    id: 'pay-105',
    userId: 'usr-6',
    userName: 'Gordon Freeman',
    userEmail: 'gordon@blackmesa.gov',
    amount: '$15.00',
    date: '2026-07-27',
    status: 'refunded',
  },
];

export const INITIAL_MOCK_TICKETS: MockSupportTicket[] = [
  {
    id: 'tkt-1',
    userId: 'usr-3',
    userName: 'Alex Mercer',
    userEmail: 'alex.mercer@gentek.org',
    subject: 'Credits not reflecting after student plan upgrade',
    status: 'open',
    createdAt: '2026-07-30 11:20',
  },
  {
    id: 'tkt-2',
    userId: 'usr-4',
    userName: 'Marcus Holloway',
    userEmail: 'marcus@dedsec.net',
    subject: 'ATS Checker failing on custom formatting PDF',
    status: 'open',
    createdAt: '2026-08-01 16:45',
  },
  {
    id: 'tkt-3',
    userId: 'usr-6',
    userName: 'Gordon Freeman',
    userEmail: 'gordon@blackmesa.gov',
    subject: 'Request account reactivation and refund status',
    status: 'resolved',
    createdAt: '2026-07-27 10:00',
  },
];
