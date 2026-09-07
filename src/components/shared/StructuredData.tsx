import React, { useEffect } from 'react';

export function StructuredData() {
  useEffect(() => {
    const id = 'applyone-structured-data';

    const existing = document.getElementById(id);

    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');

    script.id = id;
    script.type = 'application/ld+json';

    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://www.applyone.co.in/#organization',
          name: 'ApplyOne',
          url: 'https://www.applyone.co.in/',
          logo: 'https://www.applyone.co.in/logo.png',
          description:
            'ApplyOne is an AI-powered job application automation platform that helps students, freshers, and professionals discover opportunities, manage resumes, and automate job applications.',
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'supportapplyone@gmail.com',
            contactType: 'Customer Support',
            availableLanguage: ['English', 'Hindi'],
          },
          sameAs: ['https://twitter.com/ApplyOneHQ'],
        },
        {
          '@type': 'WebApplication',
          '@id': 'https://www.applyone.co.in/#webapp',
          name: 'ApplyOne',
          url: 'https://www.applyone.co.in/',
          description:
            'ApplyOne is a job application automation platform that helps students, freshers, and professionals discover opportunities, manage resumes, and automate job applications.',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
          },
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://www.applyone.co.in/#faqs',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How does ApplyOne automate my job search?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ApplyOne acts as your dedicated career assistant. Once you build your profile and define your preferences, our AI engine automatically finds relevant roles, optimizes your resume for Applicant Tracking Systems (ATS), and submits your application on your behalf.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do you optimize my resume for each job?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Our AI analyzes the specific job description and automatically tailors your resume to highlight the most relevant skills and experiences. We ensure your resume uses the right keywords and formatting to maximize your chances of passing automated ATS screenings.',
              },
            },
            {
              '@type': 'Question',
              name: 'Do I have control over where my applications are sent?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Absolutely. You set strict parameters regarding industry, location, minimum salary, and employment type. Our system only targets positions that match your exact criteria. You can review all dispatched applications in your dashboard.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is my personal data secure?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, we take data privacy very seriously. We use enterprise-grade encryption to protect your professional profile, resumes, and contact details. We only share your information with employers when submitting an application on your behalf.',
              },
            },
            {
              '@type': 'Question',
              name: 'What happens after an application is submitted?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Once we submit an application, you will see it logged in your dashboard. If an employer reaches out for an interview, they will contact you directly via the email or phone number provided on your resume. We handle the top-of-funnel work so you can focus on interviewing.',
              },
            },
          ],
        },
      ],
    });

    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return null;
}