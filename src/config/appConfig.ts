/**
 * ApplyOne Global Configuration System
 * Centralizes feature flags, routes, pricing plans, app metadata, navigation menus, and enums.
 */

export const FEATURE_FLAGS = {
  ENABLE_AI: false,
  ENABLE_PAYMENTS: false,
  ENABLE_ANALYTICS: true,
  ENABLE_ADMIN: false,
  ENABLE_RECRUITER: false,
  ENABLE_NOTIFICATIONS: false,
  ENABLE_AUTOMATION: false,
  ENABLE_DASHBOARD: false,
};

export const APP_METADATA = {
  name: 'ApplyOne',
  title: 'ApplyOne - Apply Once. Reach Everywhere.',
  description: 'The ultimate SaaS platform for students, freshers, and professionals to automate and optimize their job search and internship search. Apply once and access opportunities everywhere.',
  url: 'https://applyone.co',
  ogImage: '/images/og-image.jpg',
  twitterHandle: '@ApplyOneHQ',
  contactEmail: 'support@applyone.co',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  SUBSCRIPTIONS: '/dashboard/subscriptions',
  ATS_CHECKER: '/dashboard/ats-checker',
  SETTINGS: '/dashboard/settings',
  ADMIN: '/admin',
  PRIVACY: '/privacy',
  TERMS: '/terms',
};

export type AccountType = 'Student' | 'Fresher' | 'Professional';
export type UserRole = 'Student' | 'Recruiter' | 'Admin' | 'Super Admin';

export const ACCOUNT_TYPES: AccountType[] = ['Student', 'Fresher', 'Professional'];

export const NAVIGATION_LINKS = {
  marketing: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Resources', href: '#resources' },
    { label: 'About Us', href: '#about-us' },
  ],
  footer: {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Resources', href: '#resources' },
    ],
    company: [
      { label: 'About Us', href: '#about-us' },
      { label: 'Careers (We\'re hiring)', href: '#' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
    contact: [
      { label: 'Contact Support', href: 'mailto:support@applyone.co' },
      { label: 'FAQs', href: '#faqs' },
    ],
  },
};

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular: boolean;
  colorScheme: 'blue' | 'cyan' | 'indigo';
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'professional',
    name: 'Professional',
    price: '₹999',
    period: '/month',
    description: 'Essential matching and dispatch tools to jumpstart your applications.',
    features: [
      '10 daily job matches.',
      '10 credits / month',
      '50-60 applications/ month',
    ],
    ctaText: 'Unlock Professional',
    isPopular: false,
    colorScheme: 'blue',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹1299',
    period: '/month',
    description: 'Perfect for active job candidates hunting for multiple interview invites.',
    features: [
      '15 daily job matches.',
      '20 credits/month',
      '80-100 applications/month',
      'ATS Score Checker included',
    ],
    ctaText: 'Unlock Premium',
    isPopular: false,
    colorScheme: 'cyan',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '₹1499',
    period: '/month',
    description: 'Uncapped automation features designed for rapid placement campaigns.',
    features: [
      '25 daily job matches.',
      '30 credits / month',
      '150 applications/month',
      'ATS Score Checker included',
    ],
    ctaText: 'Unlock Elite',
    isPopular: false,
    colorScheme: 'indigo',
  },
];

export const RESOURCES = [
  {
    id: 'resume-tips',
    title: 'Resume Optimization Tips',
    description: 'Learn how to make your resume pass applicant tracking systems (ATS) with ease.',
    category: 'Guides',
    link: '/pdfs/resume-tips.pdf',
    readTime: '5 min read',
  },
  {
    id: 'interview-prep',
    title: 'Behavioral & Technical Prep',
    description: 'Master the top questions asked by tier-1 tech and consulting companies.',
    category: 'Interview',
    link: '/pdfs/interview-prep.pdf',
    readTime: '8 min read',
  },
  {
    id: 'career-guides',
    title: '2026 Student Internship Map',
    description: 'A timeline-based roadmap on when and how to apply for summer internships.',
    category: 'Career Maps',
    link: '/pdfs/internship-map.pdf',
    readTime: '12 min read',
  },
  {
    id: 'faqs',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about our platform.',
    category: 'FAQ',
    link: '#faqs',
    readTime: '3 min read',
  },
];
