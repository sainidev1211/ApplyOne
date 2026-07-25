import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';

export function Quote() {
  return (
    <section className="py-20 bg-bg-alt-light dark:bg-bg-alt-dark transition-colors duration-300 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/5 dark:bg-purple-600/5 blur-3xl" />
      
      <Container className="max-w-4xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          {/* Elegant quote marks */}
          <span className="block font-serif text-8xl text-purple-300/40 dark:text-purple-700/30 leading-none select-none">
            “
          </span>

          <blockquote className="text-2xl sm:text-4xl font-light tracking-wide text-text-primary-light dark:text-text-primary-dark leading-relaxed font-sans italic">
            Opportunity is missed by most people because it is dressed in overalls and looks like work. ApplyOne is here to handle the overalls, so you can focus on doing the work that matters.
          </blockquote>

          <div className="pt-4">
            <cite className="not-italic font-semibold text-sm sm:text-base text-text-primary-light dark:text-text-primary-dark tracking-wide uppercase">
              Thomas A. Edison
            </cite>
            <span className="block text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Prolific Inventor & Entrepreneur
            </span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
