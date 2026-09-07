import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import {
  JobPostingSchema,
  BreadcrumbsSchema,
  FaqPageSchema,
} from '@/components/shared/JsonLd';
import {
  CITY_HUBS,
  getJobsByCityAndRole,
  getInternshipsByCity,
  formatRoleTitle,
  formatCityName,
} from '@/data/programmaticJobs';

interface ProgrammaticJobPageProps {
  isInternship?: boolean;
}

export default function ProgrammaticJobPage({ isInternship = false }: ProgrammaticJobPageProps) {
  const params = useParams<{ city?: string; role?: string }>();
  const citySlug = (params.city || '').toLowerCase().trim();
  const roleSlug = (params.role || '').toLowerCase().trim();

  const hub = CITY_HUBS[citySlug];

  const jobs = useMemo(() => {
    if (!citySlug) return [];
    if (isInternship) {
      return getInternshipsByCity(citySlug);
    }
    return getJobsByCityAndRole(citySlug, roleSlug);
  }, [citySlug, roleSlug, isInternship]);

  // If no hub exists or 0 verified listings exist for this combo, redirect to main jobs directory
  // This strictly enforces the "no thin or empty programmatic pages" requirement.
  if (!hub || jobs.length === 0) {
    return <Navigate to="/jobs" replace />;
  }

  const pageTitle = isInternship
    ? `Software & Tech Internships in ${hub.cityName} (${new Date().getFullYear()})`
    : `${formatRoleTitle(roleSlug)} in ${hub.cityName} | Verified Openings`;

  const metaDesc = isInternship
    ? `Explore verified engineering and tech internships in ${hub.cityName}, ${hub.stateName}. Paid stipends, pre-placement offer (PPO) opportunities, and automated application support.`
    : `Find verified ${formatRoleTitle(roleSlug).toLowerCase()} in ${hub.cityName}, ${hub.stateName}. Check genuine salary ranges (${hub.averageFresherSalary}), top hiring zones, and apply through ApplyOne.`;

  const canonicalUrl = isInternship
    ? `https://www.applyone.co.in/internships/${citySlug}`
    : `https://www.applyone.co.in/jobs/${citySlug}/${roleSlug}`;

  const localizedFaqs = [
    {
      question: `What is the average starting salary for freshers in ${hub.cityName}?`,
      answer: `Freshers and junior engineers in ${hub.cityName} typically earn between ${hub.averageFresherSalary} depending on their technical mastery in ${hub.topSkillsInDemand.slice(0, 3).join(', ')}, academic projects, and whether the employer is an IT service firm or product startup.`,
    },
    {
      question: `Which are the primary tech hubs and IT parks in ${hub.cityName}?`,
      answer: `The major hiring clusters in ${hub.cityName} include ${hub.keyTechParks.join(', ')}. Many IT campuses and SaaS startups operate hybrid or onsite teams across these corridors.`,
    },
    {
      question: `How does ApplyOne help me get placed in ${hub.cityName}?`,
      answer: `ApplyOne scans verified employer openings across ${hub.cityName}, optimizes your resume for company-specific ATS parsers, and dispatches automated applications so your profile reaches hiring managers first.`,
    },
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={metaDesc}
        canonical={canonicalUrl}
      />

      {/* Schema.org JobPosting for each genuine verified job */}
      {jobs.map((job) => (
        <JobPostingSchema
          key={job.id}
          title={job.title}
          description={`${job.description} Requirements: ${job.requirements.join('. ')}`}
          company={job.company}
          location={job.location}
          city={hub.cityName}
          state={hub.stateName}
          employmentType={job.employmentType}
          postedDate={job.postedDate}
          validThrough={job.validThrough}
          minSalary={job.minSalary}
          maxSalary={job.maxSalary}
          salaryCurrency={job.salaryCurrency}
          canonicalUrl={canonicalUrl}
        />
      ))}

      {/* Breadcrumbs Schema */}
      <BreadcrumbsSchema
        items={[
          { name: 'Home', url: 'https://www.applyone.co.in/' },
          { name: 'Jobs', url: 'https://www.applyone.co.in/jobs' },
          {
            name: isInternship ? `Internships in ${hub.cityName}` : `${formatRoleTitle(roleSlug)} in ${hub.cityName}`,
            url: canonicalUrl,
          },
        ]}
      />

      {/* Localized FAQ schema */}
      <FaqPageSchema faqs={localizedFaqs} />

      <div className="py-12 bg-slate-50/50">
        <Container>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-8">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/jobs" className="hover:text-blue-600 transition-colors">Jobs Directory</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">
              {hub.cityName} • {isInternship ? 'Internships' : formatRoleTitle(roleSlug)}
            </span>
          </nav>

          {/* Hero Section */}
          <div className="max-w-4xl space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span>📍</span> Verified {hub.cityName}, {hub.stateName} Openings
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {pageTitle}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {hub.hubDescription} Browse {jobs.length} verified{' '}
              {isInternship ? 'internship opportunities' : 'positions'} currently recruiting in the {hub.cityName} ecosystem.
            </p>
          </div>

          {/* City Tech Ecosystem Insights Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 bg-white border border-border-light rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Average Fresher Compensation
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-blue-600 mt-2">
                {hub.averageFresherSalary}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Based on active market hiring bands in {hub.cityName}.
              </p>
            </Card>

            <Card className="p-6 bg-white border border-border-light rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Tech Parks &amp; Zones
              </span>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {hub.keyTechParks.slice(0, 3).map((park, idx) => (
                  <li key={idx} className="truncate">• {park}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 bg-white border border-border-light rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Top Skills in Demand
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hub.topSkillsInDemand.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Job Listings Section */}
          <div className="space-y-6 mb-16">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
              <span>Verified Positions in {hub.cityName}</span>
              <span className="text-sm font-normal text-slate-500">{jobs.length} Active Listings</span>
            </h2>

            <div className="space-y-6">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-6 sm:p-8 bg-white border border-border-light rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-blue-600">{job.company}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{job.hiringHub}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 mt-2">
                        <span>📍 {job.location}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">💰 {job.salaryOrStipend}</span>
                        <span>•</span>
                        <span>🏢 {job.workplaceType}</span>
                        <span>•</span>
                        <span className="text-slate-500">Exp: {job.experienceRequired}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-3">
                      <Link to="/signup">
                        <Button variant="gradient" size="md">
                          Apply with ApplyOne
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <hr className="my-6 border-slate-100" />

                  <div className="space-y-4 text-sm text-slate-700">
                    <p className="leading-relaxed">{job.description}</p>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Key Responsibilities
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600">
                        {job.responsibilities.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Qualifications &amp; Skills Required
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600">
                        {job.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Required Technologies
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Localized FAQ Section */}
          <div className="my-16 max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Frequently Asked Questions About Hiring in {hub.cityName}
            </h2>
            <div className="space-y-4">
              {localizedFaqs.map((faq, idx) => (
                <Card key={idx} className="p-6 bg-white border border-border-light rounded-xl">
                  <h3 className="font-bold text-base text-slate-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Internal Links & ATS Checker Callout */}
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Applying for {isInternship ? 'Internships' : formatRoleTitle(roleSlug)} in {hub.cityName}?
            </h3>
            <p className="max-w-2xl mx-auto text-blue-100 text-sm sm:text-base mb-6">
              Make sure your resume passes corporate ATS screening before you submit. Use our free ATS checker to optimize keyword match scores.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/dashboard/ats-checker">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3">
                  Check Resume ATS Score Free
                </Button>
              </Link>
              <Link to="/blog/how-to-write-resume-fresher-india">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 font-bold px-6 py-3">
                  Read Fresher Resume Guide &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
