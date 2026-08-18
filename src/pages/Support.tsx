import React from 'react';
import { Card } from '@/components/ui/Card';
import { SEO } from '@/components/shared/SEO';

export default function Support() {
  return (
    <>
      <SEO title="Help & Support" description="Get help with your ApplyOne account." />
      <div className="space-y-8 text-left max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Help & Support
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
            Find answers to common questions or reach out to our team for assistance.
          </p>
        </div>

        <Card className="p-8 border border-border-light dark:border-border-dark shadow-md text-center">
          <span className="text-4xl mb-4 block">✉️</span>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Contact Support Team
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
            We're here to help. Send us an email and we'll get back to you as soon as possible.
          </p>
          <a
            href="mailto:supportapplyone@gmail.com"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            Email supportapplyone@gmail.com
          </a>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-border-light dark:border-border-dark shadow-sm">
            <span className="text-2xl mb-3 block">💳</span>
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Billing & Subscriptions</h3>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              For issues with payments, plan changes, or subscription cancellations, please include your registered email and the last 4 digits of your card when emailing support.
            </p>
          </Card>

          <Card className="p-6 border border-border-light dark:border-border-dark shadow-sm">
            <span className="text-2xl mb-3 block">📄</span>
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Resume Parsing</h3>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              If your resume is not parsing correctly, ensure it is in PDF or DOCX format. For persistent issues, email us the file for manual review.
            </p>
          </Card>

          <Card className="p-6 border border-border-light dark:border-border-dark shadow-sm">
            <span className="text-2xl mb-3 block">🔒</span>
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Account Security</h3>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              If you suspect unauthorized access to your account, please change your password immediately and contact support to secure your data.
            </p>
          </Card>

          <Card className="p-6 border border-border-light dark:border-border-dark shadow-sm">
            <span className="text-2xl mb-3 block">⚙️</span>
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Technical Issues</h3>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              Encountering a bug? Please provide steps to reproduce, your browser version, and any error messages you see.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
