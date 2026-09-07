import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { BreadcrumbsSchema } from '@/components/shared/JsonLd';
import {
  VERIFIED_JOBS,
  CITY_HUBS,
  getProgrammaticCombos,
  getInternshipCities,
  formatRoleTitle,
  formatCityName,
} from '@/data/programmaticJobs';

export default function JobsDirectory() {
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const combos = useMemo(() => getProgrammaticCombos(), []);
  const internshipCities = useMemo(() => getInternshipCities(), []);

  const filteredJobs = useMemo(() => {
    if (selectedCity === 'all') return VERIFIED_JOBS;
    return VERIFIED_JOBS.filter((j) => j.city.toLowerCase() === selectedCity.toLowerCase());
  }, [selectedCity]);

  return (
    <>
      <SEO
        title="Verified Tech Jobs & Internships for Freshers across India"
        description="Browse verified software engineering jobs and internships in Indore, Pune, Bengaluru, and remote hubs. Apply through ApplyOne automation."
        canonical="https://www.applyone.co.in/jobs"
      />

      <BreadcrumbsSchema
        items={[
          { name: 'Home', url: 'https://www.applyone.co.in/' },
          { name: 'Jobs Directory', url: 'https://www.applyone.co.in/jobs' },
        ]}
      />

      <div className="py-16 bg-slate-50/50">
        <Container>
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Verified Opportunity Directory
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Verified Jobs &amp;{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Internships in India
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600">
              Targeted openings for college graduates, freshers, and junior software engineers across India’s primary tech hubs. Real verified data with zero empty listings.
            </p>
          </div>

          {/* Quick Hub Combos & Programmatic Collections */}
          <div className="mb-14">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🎯</span> Popular City &amp; Category Portals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {combos.map((combo) => (
                <Link
                  key={`${combo.city}-${combo.role}`}
                  to={`/jobs/${combo.city}/${combo.role}`}
                  className="group block p-4 rounded-xl border border-border-light bg-white hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-blue-600 capitalize">{combo.city}</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                      {combo.count} {combo.count === 1 ? 'Role' : 'Roles'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                    {formatRoleTitle(combo.role)} in {formatCityName(combo.city)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Verified full-time openings &rarr;</p>
                </Link>
              ))}

              {internshipCities.map((item) => (
                <Link
                  key={`internship-${item.city}`}
                  to={`/internships/${item.city}`}
                  className="group block p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-indigo-400 mb-1">
                    <span className="font-semibold text-indigo-600 capitalize">{item.city}</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                      {item.count} {item.count === 1 ? 'Internship' : 'Internships'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                    Tech Internships in {formatCityName(item.city)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Paid student &amp; fresher roles &rarr;</p>
                </Link>
              ))}
            </div>
          </div>

          {/* City Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <h2 className="text-xl font-bold text-slate-900">
              Active Verified Openings ({filteredJobs.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedCity === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-border-light hover:bg-slate-100'
                }`}
              >
                All Cities
              </button>
              {Object.keys(CITY_HUBS).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedCity === c
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-border-light hover:bg-slate-100'
                  }`}
                >
                  {formatCityName(c)}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs Listing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="p-6 border border-border-light bg-white rounded-2xl flex flex-col justify-between hover:shadow-lg transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">{job.company}</span>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug mt-0.5">
                        {job.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        job.employmentType === 'INTERNSHIP'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {job.employmentType === 'INTERNSHIP' ? 'Internship' : 'Full-Time'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">📍 {job.location}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">💰 {job.salaryOrStipend}</span>
                    <span>•</span>
                    <span>🏢 {job.workplaceType}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Exp: {job.experienceRequired}
                  </span>
                  <div className="flex items-center gap-2">
                    {job.employmentType === 'INTERNSHIP' ? (
                      <Link to={`/internships/${job.city}`}>
                        <Button variant="outline" size="sm">
                          View Hub &rarr;
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/jobs/${job.city}/${job.roleCategory}`}>
                        <Button variant="outline" size="sm">
                          View Hub &rarr;
                        </Button>
                      </Link>
                    )}
                    <Link to="/signup">
                      <Button variant="gradient" size="sm">
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Automation Callout */}
          <div className="mt-16 rounded-2xl bg-white border border-border-light p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-xl font-bold text-slate-900">
                Want to automate your applications to these companies?
              </h3>
              <p className="text-sm text-slate-600">
                ApplyOne matches your profile against verified roles daily and submits customized applications on your behalf.
              </p>
            </div>
            <Link to="/pricing" className="flex-shrink-0">
              <Button variant="gradient" size="md">
                Explore Automation Plans
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
}
