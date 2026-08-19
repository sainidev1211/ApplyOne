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
      '@type': 'WebApplication',
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
    });

    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return null;
}