import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';

const faqs = [
  {
    question: 'How does ApplyOne automate my job search?',
    answer:
      'ApplyOne acts as your dedicated career assistant. Once you build your profile and define your preferences, our AI engine automatically finds relevant roles, optimizes your resume for Applicant Tracking Systems (ATS), and submits your application on your behalf. This saves you hundreds of hours of manual work.',
  },
  {
    question: 'How do you optimize my resume for each job?',
    answer:
      'Our AI analyzes the specific job description and automatically tailors your resume to highlight the most relevant skills and experiences. We ensure your resume uses the right keywords and formatting to maximize your chances of passing automated ATS screenings.',
  },
  {
    question: 'Do I have control over where my applications are sent?',
    answer:
      'Absolutely. You set strict parameters regarding industry, location, minimum salary, and employment type. Our system only targets positions that match your exact criteria. You can review all dispatched applications in your dashboard.',
  },
  {
    question: 'Is my personal data secure?',
    answer:
      'Yes, we take data privacy very seriously. We use enterprise-grade encryption to protect your professional profile, resumes, and contact details. We only share your information with employers when submitting an application on your behalf.',
  },
  {
    question: 'What happens after an application is submitted?',
    answer:
      'Once we submit an application, you will see it logged in your dashboard. If an employer reaches out for an interview, they will contact you directly via the email or phone number provided on your resume. We handle the top-of-funnel work so you can focus on interviewing.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="py-20 bg-slate-50 dark:bg-bg-dark transition-colors duration-300">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark">
            Everything you need to know about how we streamline your career growth.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden border border-border-light dark:border-border-dark">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 flex items-center justify-between focus:outline-none focus:bg-slate-100 dark:focus:bg-card-dark transition-colors text-left"
              >
                <span className="font-semibold text-lg text-text-primary-light dark:text-text-primary-dark">
                  {faq.question}
                </span>
                <span className="ml-6 flex-shrink-0 text-primary">
                  <svg
                    className={`w-6 h-6 transform transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-4 text-text-secondary-light dark:text-text-secondary-dark">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
