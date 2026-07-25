import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, ToastMessage } from '@/store/toastStore';
import { cn } from '@/utils/cn';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 z-50 flex flex-col justify-start items-end p-4 md:p-6 pointer-events-none space-y-3 max-w-sm ml-auto"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: (
      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const ringColors = {
    success: 'focus:ring-green-500',
    error: 'focus:ring-red-500',
    warning: 'focus:ring-yellow-500',
    info: 'focus:ring-blue-500',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        'w-full max-w-sm pointer-events-auto bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg p-4 flex items-start gap-3',
        'ring-1 ring-black/5 dark:ring-white/5'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-left">
        {toast.title && (
          <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={cn(
          'flex-shrink-0 ml-2 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-bg-dark',
          ringColors[toast.type]
        )}
      >
        <span className="sr-only">Close</span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
