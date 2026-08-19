import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/appConfig';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export function Hero() {
  return (
    <section className="relative min-h-[90svh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-white dark:bg-bg-dark transition-colors duration-300">
      
      {/* Premium animated gradient canvas */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid-bg opacity-30 dark:opacity-40" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-400/20 dark:bg-cyan-600/10 blur-[120px] animate-pulse-slow" />
      </div>

      {/* Floating abstract decorative elements */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden sm:block">
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' as const }}
          className="absolute top-1/3 left-12 md:left-24 w-12 h-12 rounded-2xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md shadow-md flex items-center justify-center text-lg"
        >
          💼
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' as const, delay: 1 }}
          className="absolute bottom-1/4 right-12 md:right-32 w-16 h-16 rounded-full bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md shadow-lg flex items-center justify-center text-xl"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.5 }}
          className="absolute top-1/4 right-1/4 w-10 h-10 rounded-lg bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md shadow-md flex items-center justify-center text-sm"
        >
          ⚡
        </motion.div>
      </div>

      <Container className="relative z-10 text-center space-y-8 max-w-4xl">

        {/* Hero Title */}
        <div className="space-y-4">
          <motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 }}
  className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight"
>
  Automate Your Job Applications.{' '}
  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
    Reach More Opportunities.
  </span>
</motion.h1>

          {/* Hero Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto leading-relaxed"
          >
            The premium job application automation engine designed for students, freshers, and professionals. Instantly find and dispatch credentials to verified internships, part-time work, and enterprise roles.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to={ROUTES.SIGNUP} className="w-full sm:w-auto">
            <Button variant="gradient" size="lg" className="w-full sm:w-auto px-8">
              Get started
            </Button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              Learn More
            </Button>
          </a>
        </motion.div>
      </Container>
    </section>
  );
}
