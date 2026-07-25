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
import { SEO } from '@/components/shared/SEO';

export default function LandingPage() {
  return (
    <>
      <SEO
        title="Apply Once. Reach Everywhere"
        description="Simplify your job search. Build your candidate profile, set automation triggers, and dispatch your applications to internships and entry roles automatically."
      />
      <div className="flex flex-col">
        <Hero />
        <CompanyLogos />
        <Quote />
        <Features />
        <WhyChooseUs />
        <Pricing />
        <Resources />
        <Reviews />
        <AboutUs />
      </div>
    </>
  );
}
