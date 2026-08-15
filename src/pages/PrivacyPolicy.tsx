import React, { useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { SEO } from '@/components/shared/SEO';

export default function PrivacyPolicy() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <>
      <SEO 
        title="Privacy Policy | ApplyOne" 
        description="Learn how ApplyOne secures your profile, resume, and credentials with industry-standard database safeguards."
      />
      <div className="py-20 bg-bg-light dark:bg-bg-dark min-h-screen transition-colors duration-300 relative overflow-hidden text-left">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <Container className="max-w-4xl relative z-10">
          <div className="space-y-4 mb-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Privacy{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Policy
              </span>
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Last Updated: July 23, 2026
            </p>
          </div>

          <Card className="p-8 md:p-12 border border-border-light dark:border-border-dark/80 bg-white/90 dark:bg-card-dark/95 backdrop-blur-xl shadow-xl space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                1. Introduction
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                Welcome to ApplyOne. We respect your privacy and are committed to protecting your personal data. This privacy policy informs you how we look after your personal data when you visit our website (regardless of where you visit it from) and tells you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                2. Data We Collect About You
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                We may collect, use, store, and transfer different kinds of personal data about you, including:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark">
                <li><strong>Identity Data:</strong> Full name, username, and account profile details.</li>
                <li><strong>Contact Data:</strong> Email address and phone number.</li>
                <li><strong>Professional Data:</strong> Resumes, CV documents, skill certificates, job history, and salary preferences.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our matchmaking wizard, dashboards, and pages.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                3. How Your Data Is Secured
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                We implement industry-grade encryption models and security architectures to secure candidate details. Access is restricted to authenticated users and authorized platform services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                4. Matchmaking & Dispatch Data Disclosures
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                To run automated placement campaigns, ApplyOne matches candidate criteria to hiring portal APIs. We only dispatch identity details to recruiter platforms once our advanced matching algorithms score compatibility triggers above standard parameters, and with your consent as defined during the matching wizard flow.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                5. Your Legal Rights
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to withdraw consent. You can delete your resume data or cancel your active subscription directly inside the dashboard settings at any time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                6. Contact Information
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                If you have questions about this privacy policy or wish to exercise any of your rights, please reach out to our privacy compliance desk at <a href="mailto:supportapplyone@gmail.com" className="text-primary hover:underline font-semibold">supportapplyone@gmail.com</a>.
              </p>
            </section>
          </Card>
        </Container>
      </div>
    </>
  );
}
