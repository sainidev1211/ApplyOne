import React, { useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { SEO } from '@/components/shared/SEO';

export default function TermsOfService() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <>
      <SEO 
        title="Terms of Service | ApplyOne" 
        description="Read the official terms and conditions governing the use of the ApplyOne job matching and campaign dispatch systems." 
      />
      <div className="py-20 bg-bg-light dark:bg-bg-dark min-h-screen transition-colors duration-300 relative overflow-hidden text-left">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

        <Container className="max-w-4xl relative z-10">
          <div className="space-y-4 mb-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Terms of{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Service
              </span>
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Last Updated: July 23, 2026
            </p>
          </div>

          <Card className="p-8 md:p-12 border border-border-light dark:border-border-dark/80 bg-white/90 dark:bg-card-dark/95 backdrop-blur-xl shadow-xl space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                1. Agreement to Terms
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                By accessing or using ApplyOne (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                2. User Account Registration
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep this information updated. You are responsible for safeguarding your account credentials and for any activities or actions under your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                3. Subscriptions, Pricing, and Credits
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                Some features of the Service are billed on a subscription basis (Starter, Professional, or Premium plans). Subscriptions are billed in advance on a recurring monthly basis.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark">
                <li><strong>Credits:</strong> Matching and dispatch credits are allocated monthly according to your plan tiers and expire at the end of each billing cycle.</li>
                <li><strong>Cancellations:</strong> You can cancel your subscription at any time. Active benefits continue until the end of the paid period.</li>
                <li><strong>Refunds:</strong> Except as required by law, subscription payments are non-refundable.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                4. Acceptable Platform Use
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark">
                <li>Submit false, misleading, or plagiarized resume credentials.</li>
                <li>Attempt to scrape, reverse-engineer, or breach security parameters of the database.</li>
                <li>Spam matching portals or upload malicious scripting files.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                5. Limitation of Liability & ATS Shortlisting Disclaimer
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed font-semibold">
                ApplyOne matches and dispatches resumes to recruiter portals using automated algorithms. Shortlisting and hiring decisions ultimately depend on the Applicant Tracking System (ATS) score of the candidate's resume and recruiter reviews. ApplyOne does not guarantee interviews, placement guarantees, or employment offers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                6. Changes to Terms
              </h2>
              <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice before any new terms take effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
          </Card>
        </Container>
      </div>
    </>
  );
}
