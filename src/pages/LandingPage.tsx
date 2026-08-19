import React from 'react';
import { Hero } from '@/features/marketing/components/Hero';
import { CompanyLogos } from '@/features/marketing/components/CompanyLogos';
import { Quote } from '@/features/marketing/components/Quote';
import { Features } from '@/features/marketing/components/Features';
import { Pricing } from '@/features/marketing/components/Pricing';
import { WhyChooseUs } from '@/features/marketing/components/WhyChooseUs';
import { Resources } from '@/features/marketing/components/Resources';
import { AboutUs } from '@/features/marketing/components/AboutUs';
import { Reviews } from '@/features/marketing/components/Reviews';
import { FAQ } from '@/features/marketing/components/FAQ';
import { SEO } from '@/components/shared/SEO';
import { StructuredData } from '@/components/shared/StructuredData';

export default function LandingPage() {
  return (
    <>
      {/* SEO metadata */}
      <SEO
        title="Job Application Automation Platform"
        description="ApplyOne is a job application automation platform for students, freshers, and professionals. Discover job opportunities, manage your resume, and automate applications to internships, part-time jobs, and full-time roles."
        canonical="https://www.applyone.co.in/"
        
      />

      {/* Structured data for search engines */}
      <StructuredData />

      {/* Existing landing page design */}
      <div className="flex flex-col">
        <Hero />
        <CompanyLogos />
        <Quote />
        <Features />
        <WhyChooseUs />
        <Pricing />
        <Resources />
        <FAQ />
        <Reviews />
        <AboutUs />
      </div>
    </>
  );
}