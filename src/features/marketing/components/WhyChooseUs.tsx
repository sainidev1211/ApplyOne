import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

export function WhyChooseUs() {
  const benefits = [
    {
      title: 'Advanced Matchmaking Algorithms',
      description: 'Our proprietary parsing models check and pair candidate credentials with high-probability matches in real-time, bypassing recruiter filters entirely.',
      icon: '🧠',
    },
    {
      title: 'Unmatched Cost Affordability',
      description: 'Get standard-setting campaign automation at a fraction of the cost. We are significantly cheaper than consultancies, agencies, or manual resume sending services.',
      icon: '💎',
    },
    {
      title: 'ATS Schema Domination',
      description: 'Clear automated screeners with ease. Our system restructures your credentials to align with Applicant Tracking System criteria, maintaining a 92%+ pass rate.',
      icon: '🎯',
    },
    {
      title: 'Multi-Channel Dispatch Velocity',
      description: 'Configure separate salary goals for Full-Time, Part-Time, or Internship profiles. Our pipeline splits and formats your applications dynamically.',
      icon: '🚀',
    },
  ];

  return (
    <section className="py-24 bg-bg-alt-light dark:bg-bg-alt-dark transition-colors duration-300 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* LEFT COLUMN: Animated Performance Showcase */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Graphic Stats Mockup Card */}
              <Card className="p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-2xl space-y-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500/10 text-primary dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Performance Metrics
                </div>

                {/* ATS Circle Gauge */}
                <div className="flex items-center gap-6">
                  <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Grey background ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-slate-100 dark:stroke-slate-800"
                        strokeWidth="10"
                        fill="none"
                      />
                      {/* Gradient foreground ring */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-blue-600"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        whileInView={{ strokeDashoffset: 251.2 - (251.2 * 0.92) }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-lg font-extrabold text-text-primary-light dark:text-text-primary-dark">
                      92%
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">
                      ATS Compatibility Pass Rate
                    </h4>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      Our parsing schema outperforms industry standards, clearing ATS auto-filters with ease.
                    </p>
                  </div>
                </div>

                {/* Velocity Indicator */}
                <div className="p-4 bg-slate-50 dark:bg-bg-dark rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                  <div>
                    <span className="block text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      10x Faster
                    </span>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      Average placement match velocity
                    </span>
                  </div>
                  <span className="text-3xl">🚀</span>
                </div>

                {/* Dispatch Simulator Track */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider block">
                    Automation Pipeline Stream
                  </span>
                  
                  {/* Step list simulator */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                      <span>✓</span>
                      <span>Resume Parsed & ATS Formatted</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                      <span>✓</span>
                      <span>Salary Goals Split & Match Secured</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 animate-pulse font-semibold">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      <span>Dispatch Queue Active (10 Matches Found)</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Value propositions */}
          <div className="lg:col-span-7 text-left space-y-8">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-blue-500/10 text-primary dark:text-blue-400 text-xs font-extrabold rounded-full uppercase tracking-wider">
                Value Proposition
              </span>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark leading-tight">
                Why{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Choose Us?
                </span>
              </h2>
              <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                ApplyOne is not just another job portal. We are an advanced campaign automation pipeline built to accelerate your career placement at an unbeatable value.
              </p>
            </div>

            {/* Benefit pillars grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="space-y-2 p-4 rounded-xl hover:bg-white dark:hover:bg-card-dark transition-colors duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl h-9 w-9 rounded-lg bg-white dark:bg-bg-dark shadow-sm border border-border-light dark:border-border-dark flex items-center justify-center">
                      {benefit.icon}
                    </span>
                    <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark text-sm sm:text-base">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}
