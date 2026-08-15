import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { APP_METADATA, PRICING_PLANS } from '@/config/appConfig';
import { toast } from '@/store/toastStore';

export default function Subscriptions() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Compute dates based on registration date (or fallback to today)
  const registrationDate = profile?.created_at ? new Date(profile.created_at) : new Date();
  
  // Format dates: e.g. July 23, 2026
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Expiration is exactly 1 month after purchase
  const expirationDate = new Date(registrationDate);
  expirationDate.setMonth(expirationDate.getMonth() + 1);

  // Determine active plan dynamically from user's registration data (Student -> Professional, Fresher -> Premium, Professional -> Elite)
  const getActivePlan = () => {
    const type = profile?.account_type || 'Fresher';
    if (type === 'Student') {
      return PRICING_PLANS.find((p) => p.id === 'professional') || PRICING_PLANS[0];
    } else if (type === 'Professional') {
      return PRICING_PLANS.find((p) => p.id === 'elite') || PRICING_PLANS[2];
    } else {
      return PRICING_PLANS.find((p) => p.id === 'premium') || PRICING_PLANS[1];
    }
  };

  const activePlan = getActivePlan();
  const planName = `${activePlan.name} Plan`;
  const planPrice = activePlan.price;

  const handleCancel = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        'Your subscription will remain active until the end of the current billing cycle.',
        'Cancellation Request Sent'
      );
    }, 1000);
  };

  return (
    <div className="space-y-8 text-left max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-sans font-bold text-text-primary-light dark:text-text-primary-dark">
          Subscription Management
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Review your current plan benefits, billing cycle, active limits, and transactions.
        </p>
      </div>

      {/* Subscription Active Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active plan overview card */}
        <Card className="p-6 md:col-span-2 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark relative overflow-hidden flex flex-col justify-between shadow-md">
          {/* Subtle brand gradient background glow */}
          <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-blue-600/10 to-cyan-600/10 rounded-full filter blur-xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                Active Subscription
              </span>
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
              {planName}
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1.5">
              Automated high-velocity match queue active. Daily limits refreshed.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-light dark:border-border-dark pt-5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark block font-bold">
                  Purchase Date
                </span>
                <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mt-1 block">
                  {formatDate(registrationDate)}
                </span>
              </div>
              
              <div>
                <span className="text-[10px] uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark block font-bold">
                  Expiration Date
                </span>
                <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mt-1 block">
                  {formatDate(expirationDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-border-light dark:border-border-dark flex items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                {planPrice}
              </span>
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark"> / month</span>
            </div>
            
            <div className="flex flex-col items-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/50"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel Subscription
              </Button>
              <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark font-medium leading-none">
                Subscription payments are non-refundable.
              </span>
            </div>
          </div>
        </Card>

        {/* Benefits panel card */}
        <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              Included Benefits
            </h3>
            
            <ul className="space-y-3.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {activePlan.features.map((feat, idx) => {
                const isCreditsLine = feat.toLowerCase().includes('credits');
                return (
                  <li key={idx} className="flex items-center gap-2.5">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="flex items-center gap-1.5">
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

          <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block text-center font-semibold">
              Need more limits? Contact support to upgrade your campaign limits.
            </span>
          </div>
        </Card>

      </div>

      {/* Transaction billing history */}
      <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md">
        <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
          Billing History
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary-light dark:text-text-secondary-dark">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark/80 text-text-primary-light dark:text-text-primary-dark font-bold">
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Transaction ID</th>
                <th className="py-2.5">Payment Method</th>
                <th className="py-2.5">Amount</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark/40">
              <tr>
                <td className="py-3">{formatDate(registrationDate)}</td>
                <td className="py-3 font-mono">TXN-749102848-APPLY</td>
                <td className="py-3">Visa ending in •••• 4242</td>
                <td className="py-3 font-semibold text-text-primary-light dark:text-text-primary-dark">{planPrice}</td>
                <td className="py-3">
                  <span className="inline-block bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                    Paid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
