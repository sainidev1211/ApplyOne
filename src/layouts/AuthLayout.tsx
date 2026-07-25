import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '@/config/appConfig';
import { Logo } from '@/components/shared/Logo';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4 py-12 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
      
      {/* Floating Animated Gradient Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -50, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 30, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-3xl"
        />
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <Link to={ROUTES.HOME} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <Logo iconSize="h-10 w-10" textClass="text-2xl" />
          </Link>
        </div>

        {/* Auth Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white/80 dark:bg-card-dark/80 backdrop-blur-xl border border-border-light dark:border-border-dark/85 rounded-2xl shadow-xl p-8 space-y-6"
        >
          <Outlet />
        </motion.div>

        {/* Footer text */}
        <p className="text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Secured by Supabase Auth with RLS database encryption.
        </p>
      </div>
    </div>
  );
}
