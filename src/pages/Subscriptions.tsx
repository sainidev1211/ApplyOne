import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { plansApi, subscriptionsApi } from '@/services/api/apiClient';
import RazorpayCheckout from '@/components/ui/RazorpayCheckout';

export default function Subscriptions() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.allSettled([plansApi.getPublic(), subscriptionsApi.getCurrent()]);
      if (plansRes.status === 'fulfilled') setPlans(Array.isArray(plansRes.value) ? plansRes.value : []);
      if (subRes.status === 'fulfilled') setCurrentSubscription(subRes.value || null);
    } catch (error: any) {
      console.warn('[Subscriptions] load failed', error);
      setPlans([]);
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activePlan = useMemo(() => {
    if (!currentSubscription) return null;
    return currentSubscription.plan || plans.find((plan) => plan.id === currentSubscription.planId) || null;
  }, [currentSubscription, plans]);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return 'Not available';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePaymentSuccess = async () => {
    await loadData();
    toast.success('Subscription activated successfully.', 'Payment Successful');
  };

  const handlePaymentError = (error: any) => {
    toast.error(error?.message || 'Payment could not be completed.', 'Payment Failed');
  };

  const normalizeFeatures = (features: any) => {
    if (Array.isArray(features)) return features;
    if (features && typeof features === 'object') return Object.values(features);
    return [];
  };

  const isSubscriptionUsable = Boolean(
    currentSubscription &&
    currentSubscription.status === 'ACTIVE' &&
    new Date(currentSubscription.expiresAt || 0).getTime() > Date.now(),
  );

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto px-4 py-6 md:px-0">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300">
          Billing & plans
        </div>
        <h1 className="text-2xl font-sans font-bold text-text-primary-light dark:text-text-primary-dark md:text-3xl">
          Subscription Management
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Choose a plan, complete secure Razorpay checkout, and unlock the dashboard features for your billing cycle.
        </p>
      </div>

      {loading ? (
        <Card className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-sm text-text-secondary-light dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 shadow-lg shadow-slate-200/60 dark:shadow-none">
          Loading plans and subscription status...
        </Card>
      ) : isSubscriptionUsable ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="md:col-span-2">
            <Card className="relative h-full overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-cyan-50/80 p-6 shadow-xl shadow-blue-100/60 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40 dark:shadow-none">
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                    Active Subscription
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/70">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>

                <h2 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                  {activePlan.name}
                </h2>
                <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Your benefits are active and will remain available until the expiry date below.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/50">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Start Date
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {formatDate(currentSubscription.startDate)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Expiration Date
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {formatDate(currentSubscription.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div>
                  <span className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                    ₹{activePlan.monthlyPrice || 0}
                  </span>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark"> / month</span>
                </div>
                <Button variant="outline" size="sm" className="text-xs rounded-xl border-slate-200 bg-white/80 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700">
                  Manage Plan
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
            <Card className="h-full rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-4">
                Included Benefits
              </h3>
              <ul className="space-y-3.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {normalizeFeatures(activePlan.features).map((feature: string, idx: number) => (
                  <li key={`${feature}-${idx}`} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              No active subscription found. Pick a plan below to complete a secure Razorpay checkout and unlock your account.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.length > 0 ? (
              plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.06 }}
                >
                  <Card className={`relative h-full overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                    plan.id === 'premium'
                      ? 'border-cyan-500 bg-gradient-to-b from-white via-cyan-50/60 to-blue-50/80 shadow-cyan-100/60 dark:border-cyan-500 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40 dark:shadow-none'
                      : 'border-slate-200 bg-white/90 shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none'
                  }`}>
                    {plan.id === 'premium' && (
                      <div className="absolute right-4 top-4">
                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300">
                          Popular
                        </span>
                      </div>
                    )}

                    <div className="space-y-6 pt-5">
                      <div>
                        <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">{plan.name}</h3>
                        <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          {plan.description || 'Flexible access for your job search workflow.'}
                        </p>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">₹{plan.monthlyPrice || 0}</span>
                        <span className="pb-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">/ month</span>
                      </div>

                      <ul className="space-y-2.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {normalizeFeatures(plan.features).map((feature: string, featureIdx: number) => (
                          <li key={`${plan.id}-${featureIdx}`} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                              ✓
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <RazorpayCheckout
                        planId={plan.id}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="p-6 md:col-span-3 text-sm text-text-secondary-light dark:text-text-secondary-dark rounded-2xl border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/80">
                No plans are available right now. Please contact support or try again later.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
