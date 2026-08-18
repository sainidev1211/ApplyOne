import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/appConfig';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { plansApi } from '@/services/api/apiClient';
import RazorpayCheckout from '@/components/ui/RazorpayCheckout';

const normalizeFeatures = (features: any): string[] => {
  if (Array.isArray(features)) return features;
  if (features && typeof features === 'object') return Object.values(features).map(String);
  return [];
};

export function Pricing() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await plansApi.getPublic();
        setPlans(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn('[Pricing] fallback plan load failed', error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handlePaymentSuccess = async () => {
    toast.success('Subscription activated successfully.', 'Payment Successful');
  };

  const handlePaymentError = (error: any) => {
    toast.error(error?.message || 'Payment could not be completed.', 'Payment Failed');
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <Container>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
          <div className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            Flexible pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark">
            Choose the membership tier that fits your job search pace. Upgrade anytime and unlock high-velocity application workflows.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {loading ? (
            <div className="md:col-span-3 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark py-10">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="md:col-span-3 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark py-10">
              Plans are currently unavailable. Please try again shortly.
            </div>
          ) : (
            plans.map((plan, idx) => {
              const isPopular = plan.id === 'elite' || plan.monthlyPrice === 1499;
              const features = normalizeFeatures(plan.features);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="flex"
                >
                  <Card
                    className={`relative flex flex-col justify-between w-full h-full text-left p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                      isPopular
                        ? 'border-2 border-cyan-500 bg-gradient-to-b from-white via-blue-50/60 to-cyan-50/70 shadow-xl scale-[1.02] z-10 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40'
                        : 'border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none'
                    }`}
                  >
                    {/* Popular Indicator */}
                    {isPopular && (
                      <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                        <Badge variant="secondary" className="px-3 py-1 shadow-md">
                          MOST POPULAR
                        </Badge>
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Header Details */}
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                            {plan.name}
                          </h3>
                          {plan.id === 'elite' && (
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/50 dark:text-violet-300">
                              Pro
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark min-h-[42px] leading-relaxed">
                          {plan.description || 'Choose the plan that best fits your job search goals.'}
                        </p>
                      </div>

                      {/* Price Block */}
                      <div className="flex items-end gap-2">
                        <span className="text-4xl sm:text-5xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                          ₹{plan.monthlyPrice || 0}
                        </span>
                        <span className="pb-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          /month
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">Included:</span> {features.slice(0, 2).join(' • ')}
                      </div>

                      <hr className="border-border-light dark:border-border-dark" />

                      {/* Features List */}
                      <ul className="space-y-3.5 flex-1">
                        {features.map((feat, featureIdx) => (
                          <li key={`${plan.id}-feature-${featureIdx}`} className="flex items-start text-sm group">
                            {/* Check Icon */}
                            <span className="mt-0.5 mr-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                              ✓
                            </span>
                            <span className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Button Block */}
                    <div className="mt-8 pt-4">
                      {user ? (
                        <RazorpayCheckout
                          planId={plan.id}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      ) : (
                        <Link to={ROUTES.SIGNUP} className="w-full block">
                          <Button variant={isPopular ? 'gradient' : 'outline'} className="w-full h-12 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-none transition-all duration-300" size="md">
                            Buy / Unlock
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </Container>
    </section>
  );
}
