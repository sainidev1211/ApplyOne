import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionsApi.cancel({ reason: 'User requested cancellation via dashboard' });
      toast.success('Your cancellation request has been submitted. Our team will process it shortly.', 'Cancellation Submitted');
      setShowCancelModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Cancellation request failed. Please contact support.', 'Cancellation Failed');
    } finally {
      setCancelling(false);
    }
  };

  // Determine the popular plan: prefer 'elite', fallback to last plan
  const getIsPopular = (plan: any, idx: number) => {
    const hasElite = plans.some((p) => p.id === 'elite');
    if (hasElite) return plan.id === 'elite';
    return idx === plans.length - 1;
  };

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto px-4 py-6 md:px-0">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300">
          Billing &amp; plans
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
                  {activePlan?.name}
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
                    ₹{activePlan?.monthlyPrice || 0}
                  </span>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark"> / month</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs rounded-xl border-red-200 bg-white/80 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  Cancel Plan
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
                {normalizeFeatures(activePlan?.features).map((feature: string, idx: number) => (
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
              plans.map((plan, idx) => {
                const isPopular = getIsPopular(plan, idx);
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.06 }}
                  >
                    <Card className={`relative h-full overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                      isPopular
                        ? 'border-indigo-500 bg-gradient-to-b from-white via-indigo-50/60 to-violet-50/80 shadow-indigo-100/60 dark:border-indigo-500 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 dark:shadow-none'
                        : 'border-slate-200 bg-white/90 shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none'
                    }`}>
                      {isPopular && (
                        <div className="absolute right-4 top-4">
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                            Most Popular
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
                );
              })
            ) : (
              <Card className="p-6 md:col-span-3 text-sm text-text-secondary-light dark:text-text-secondary-dark rounded-2xl border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/80">
                No plans are available right now. Please contact support (supportapplyone@gmail.com) or try again later.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  Cancel Your Subscription?
                </h2>
              </div>

              <div className="space-y-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <p>
                  Are you sure you want to cancel your subscription?
                </p>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Important — No Refunds</p>
                  <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                    Your subscription cancellation will be processed according to ApplyOne's cancellation policy.
                    Payments already made are <strong>non-refundable</strong>. You will continue to have access
                    until your current billing period ends.
                  </p>
                </div>
                <p>
                  If you need assistance or have any questions, please contact our support team at{' '}
                  <a
                    href="mailto:supportapplyone@gmail.com"
                    className="font-semibold text-primary hover:underline"
                  >
                    supportapplyone@gmail.com
                  </a>
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Submitting...' : 'Cancel Subscription'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

