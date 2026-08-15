import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

interface Review {
  id: string;
  name: string;
  role: string;
  company?: string;
  rating: number;
  content: string;
  avatar: string;
}

const reviews: Review[] = [
  {
    id: '1',
    name: 'Rohan Sharma',
    role: 'CS Student',
    company: 'IIT Delhi',
    rating: 5,
    content: 'ApplyOne saved me weeks of manual form-filling during internship season. I got matched to 4 tech startups and landed a Software Engineer Intern role at Acme!',
    avatar: 'RS',
  },
  {
    id: '2',
    name: 'Sneha Patel',
    role: 'Recent Graduate',
    company: 'Fresher',
    rating: 4.5,
    content: 'The expected package configuration is amazing. I selected multiple employment types and set distinct targets. Automated dispatch got me shortlisted for two remote roles in a week.',
    avatar: 'SP',
  },
  {
    id: '3',
    name: 'David Vance',
    role: 'Junior Frontend Developer',
    company: 'DevHQ',
    rating: 5,
    content: "Honestly, the ATS resume score tip was a game changer. I updated my resume based on the guidelines, and the matches immediately improved. Got an offer yesterday!",
    avatar: 'DV',
  },
  {
    id: '4',
    name: 'Ananya Iyer',
    role: 'MBA Candidate',
    company: 'FMS Delhi',
    rating: 4,
    content: 'Great platform for finding part-time consulting gigs alongside my classes. Clean layout, extremely fast, and the dashboard metrics update instantly.',
    avatar: 'AI',
  },
  {
    id: '5',
    name: 'Michael Chang',
    role: 'Software Engineer',
    company: 'Fintech Corp',
    rating: 5,
    content: "As a working professional, I did not have time to fill out portal pages after work. ApplyOne's automated application pipeline is smooth. Recommending to all my peers.",
    avatar: 'MC',
  },
  {
    id: '6',
    name: 'Priya Nair',
    role: 'Data Analyst',
    company: 'Fresher',
    rating: 4.5,
    content: 'I was skeptical about the resume matching, but after uploading, the matches for Analyst roles were spot-on. The disclaimer is honest, but the tech does the job.',
    avatar: 'PN',
  },
  {
    id: '7',
    name: 'Liam Gallagher',
    role: 'UI Designer',
    company: 'Freelance',
    rating: 4,
    content: 'Solid UI. The dark theme is beautiful, and the onboarding wizard is incredibly intuitive. I love the interactive application tracking dashboard.',
    avatar: 'LG',
  },
  {
    id: '8',
    name: 'Karan Malhotra',
    role: 'CS Student',
    company: 'BITS Pilani',
    rating: 5,
    content: 'Simple and incredibly fast. The Google login and resume wizard took less than 2 minutes. Already have 3 active interviews logged.',
    avatar: 'KM',
  },
  {
    id: '9',
    name: 'Sarah Jenkins',
    role: 'Junior Product Manager',
    company: 'AppScale',
    rating: 4.5,
    content: 'Excellent SaaS experience. It does exactly what it promises—reduces the overhead of job seeking so you can focus on interview preparation.',
    avatar: 'SJ',
  },
];

export function Reviews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Sync window widths to determine responsive items per view
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerView = windowWidth >= 1024 ? 3 : windowWidth >= 768 ? 2 : 1;
  const maxIndex = reviews.length - itemsPerView;

  // Clamp current index when items per view resize
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [itemsPerView, currentIndex, maxIndex]);

  // Auto-scroll loop every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
  };

  // Mathematical percentage translation calculation
  const translateX = -currentIndex * (100 / reviews.length);

  return (
    <section className="py-20 bg-white dark:bg-bg-dark transition-colors duration-300 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/5 dark:bg-blue-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 dark:bg-cyan-600/5 blur-3xl pointer-events-none" />

      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 text-left">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Trusted by{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Thousands
              </span>
            </h2>
            <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark">
              See what students, freshers, and professionals are saying about their ApplyOne automation campaigns.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Previous review"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark text-text-primary-light dark:text-text-primary-dark transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Next review"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel Viewport */}
        <div className="overflow-hidden w-full py-4">
          <motion.div
            className="flex"
            animate={{ x: `${translateX}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{
              width: `${(reviews.length / itemsPerView) * 100}%`,
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  width: `${100 / reviews.length}%`,
                }}
                className="px-3"
              >
                <Card className="p-6 h-full flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-colors duration-300">
                  <div className="space-y-4">
                    {/* Stars Rating */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => {
                        const starNum = i + 1;
                        if (review.rating >= starNum) {
                          // Full star
                          return (
                            <svg
                              key={i}
                              className="h-4.5 w-4.5 text-amber-400 fill-current"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        } else if (review.rating >= starNum - 0.5) {
                          // Half star
                          return (
                            <div key={i} className="relative h-4.5 w-4.5">
                              {/* Background empty star */}
                              <svg
                                className="absolute inset-0 h-4.5 w-4.5 text-slate-200 dark:text-slate-700 fill-current"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {/* Foreground filled left-half star */}
                              <div className="absolute inset-0 w-[50%] overflow-hidden pointer-events-none">
                                <svg
                                  className="h-4.5 w-4.5 text-amber-400 fill-current"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  style={{ maxWidth: 'none' }}
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </div>
                            </div>
                          );
                        } else {
                          // Empty star
                          return (
                            <svg
                              key={i}
                              className="h-4.5 w-4.5 text-slate-200 dark:text-slate-700 fill-current"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        }
                      })}
                    </div>

                    {/* Review Content */}
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      "{review.content}"
                    </p>
                  </div>

                  {/* Profile Signature */}
                  <div className="flex items-center gap-3 pt-6 border-t border-border-light dark:border-border-dark/60 mt-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold shadow-inner flex-shrink-0">
                      {review.avatar}
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                        {review.name}
                      </h4>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                        {review.role} {review.company ? `@ ${review.company}` : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
