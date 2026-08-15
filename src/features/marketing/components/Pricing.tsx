import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PRICING_PLANS, ROUTES } from '@/config/appConfig';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-bg-alt-light dark:bg-bg-alt-dark transition-colors duration-300">
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark">
            Choose the membership tier that fits your applications velocity needs. Upgrade or cancel anytime.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan, idx) => {
            const isPopular = plan.isPopular;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex"
              >
                <Card
                  className={`relative flex flex-col justify-between w-full h-full text-left p-6 md:p-8 bg-white dark:bg-card-dark transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-500/40 dark:hover:border-cyan-500/40 ${
                    isPopular
                      ? 'border-2 border-cyan-500 shadow-xl scale-100 md:scale-[1.03] z-10'
                      : 'border border-border-light dark:border-border-dark'
                  }`}
                >
                  {/* Popular Indicator */}
                  {isPopular && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                      <Badge variant="secondary" className="px-3 py-1">
                        MOST POPULAR
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Header Details */}
                    <div>
                      <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 min-h-[40px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                        {plan.price}
                      </span>
                      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark ml-1">
                        {plan.period}
                      </span>
                    </div>

                    <hr className="border-border-light dark:border-border-dark" />

                    {/* Features List */}
                    <ul className="space-y-3.5 flex-1">
                      {plan.features.map((feat, idx) => {
                        const isCreditsLine = feat.toLowerCase().includes('credits');
                        return (
                          <li key={idx} className="flex items-start text-sm">
                            {/* Check Icon */}
                            <svg
                              className="h-5 w-5 text-green-500 mr-2.5 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1.5">
                              {feat}
                              {isCreditsLine && (
                                <div className="group relative inline-block">
                                  <button
                                    type="button"
                                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-help"
                                    aria-label="More information"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  {/* Tooltip */}
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-slate-900 dark:bg-slate-800 p-2 text-center text-[10px] leading-relaxed font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                                    Credits are used to automate applications on career portals that would otherwise require manual submission by the user.
                                    {/* Triangle arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                                  </div>
                                </div>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Button Block */}
                  <div className="mt-8 pt-4">
                    <Link to={ROUTES.SIGNUP} className="w-full">
                      <Button
                        variant={isPopular ? 'gradient' : 'outline'}
                        className="w-full"
                        size="md"
                      >
                        {plan.ctaText}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
