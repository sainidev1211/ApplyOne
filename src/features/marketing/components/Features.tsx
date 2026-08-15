import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  isComingSoon?: boolean;
}

const features: FeatureItem[] = [
  {
    icon: '⚡',
    title: 'One-Click Applications',
    description: 'Submit your profile instantly to hundreds of verified vacancies matching your credentials.',
  },
  {
    icon: '🔍',
    title: 'Internship Finder',
    description: 'Designed specifically for students seeking summer, winter, and year-round corporate training terms.',
  },
  {
    icon: '🕒',
    title: 'Part-Time Jobs',
    description: 'Flexible shifts and remote work agreements perfect for freshers and working professionals alike.',
  },
  {
    icon: '🧠',
    title: 'AI Resume Matching',
    description: 'Tailor your resume statements to specific vacancy keywords instantly. Powered by NLP models.',
    isComingSoon: true,
  },
  {
    icon: '📊',
    title: 'Smart Application Tracking',
    description: 'Keep track of application states, test deadlines, and recruiter responses in a single interface.',
    isComingSoon: true,
  },
  {
    icon: '🛡️',
    title: 'Fast & Secure Platform',
    description: 'We prioritize your data security with end-to-end RLS encryption and secure session pipelines.',
  },
];

export function Features() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <section id="features" className="py-20 bg-white dark:bg-bg-dark transition-colors duration-300">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Designed for the{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Modern Candidate
            </span>
          </h2>
          <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark">
            Everything you need to bypass tedious applications and jump straight to the technical review and interview steps.
          </p>
        </div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat, idx) => (
            <motion.div key={idx} variants={cardVariants}>
              <Card hoverable className="h-full text-left flex flex-col justify-between">
                <CardContent className="space-y-4 p-6">
                  {/* Icon Block */}
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-2xl shadow-inner">
                    {feat.icon}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        {feat.title}
                      </h3>
                      {feat.isComingSoon && (
                        <Badge variant="secondary">Soon</Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
