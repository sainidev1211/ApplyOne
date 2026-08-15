import React from 'react';
import { motion } from 'framer-motion';
import { RESOURCES } from '@/config/appConfig';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

export function Resources() {
  return (
    <section id="resources" className="py-20 bg-white dark:bg-bg-dark transition-colors duration-300">
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Learning &{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Growth Hub
            </span>
          </h2>
          <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark">
            Expert resources, roadmap updates, and operational strategies to maximize interview conversion rates.
          </p>
        </div>

        {/* Resources Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {RESOURCES.map((res, idx) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex"
            >
              <Card hoverable className="w-full flex flex-col justify-between text-left">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge variant="primary">{res.category}</Badge>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                      {res.readTime}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark hover:text-primary transition-colors cursor-pointer">
                      {res.title}
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                </CardContent>

                <div className="px-6 pb-6 pt-2">
                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover group"
                  >
                    Read Guide
                    <svg
                      className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Blog (Coming Soon) Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: RESOURCES.length * 0.1 }}
            className="flex"
          >
            <Card className="w-full border border-dashed border-border-light dark:border-border-dark flex flex-col justify-between text-left bg-slate-50/50 dark:bg-card-dark/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <Badge variant="gray">Blog</Badge>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="space-y-2 opacity-60">
                  <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    Corporate Hiring Insights
                  </h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    A regular series showcasing interview panels guidelines, applicant selection criteria, and salary negotiations models.
                  </p>
                </div>
              </CardContent>

              <div className="px-6 pb-6 pt-2 opacity-50">
                <span className="inline-flex items-center text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Subscription Feed Coming Soon
                </span>
              </div>
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
