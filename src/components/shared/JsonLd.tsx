import React, { useEffect } from 'react';

interface BaseJsonLdProps {
  id: string;
  schema: Record<string, any>;
}

export function JsonLd({ id, schema }: BaseJsonLdProps) {
  useEffect(() => {
    const elementId = `schema-${id}`;
    let scriptTag = document.getElementById(elementId) as HTMLScriptElement | null;

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = elementId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    scriptTag.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById(elementId);
      if (existing) {
        existing.remove();
      }
    };
  }, [id, schema]);

  return null;
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.applyone.co.in/#organization',
    name: 'ApplyOne',
    url: 'https://www.applyone.co.in/',
    logo: 'https://www.applyone.co.in/logo.png',
    description: 'ApplyOne is an AI-powered job application automation platform for students, freshers, and professionals in India.',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'supportapplyone@gmail.com',
        contactType: 'Customer Support',
        availableLanguage: ['English', 'Hindi'],
      },
    ],
    sameAs: ['https://twitter.com/ApplyOneHQ'],
  };

  return <JsonLd id="organization" schema={schema} />;
}

export function FaqPageSchema({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return <JsonLd id="faq-page" schema={schema} />;
}

export function BlogPostSchema({
  title,
  description,
  publishDate,
  canonicalUrl,
  authorName,
  keywords,
}: {
  title: string;
  description: string;
  publishDate: string;
  canonicalUrl: string;
  authorName: string;
  keywords: string[];
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    datePublished: publishDate,
    dateModified: publishDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Organization',
      name: authorName,
      url: 'https://www.applyone.co.in/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ApplyOne',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.applyone.co.in/logo.png',
      },
    },
    keywords: keywords.join(', '),
  };

  return <JsonLd id={`blog-${title.replace(/[^a-zA-Z0-9]/g, '-')}`} schema={schema} />;
}

export function JobPostingSchema({
  title,
  description,
  company,
  location,
  city,
  state,
  employmentType,
  postedDate,
  validThrough,
  minSalary,
  maxSalary,
  salaryCurrency,
  canonicalUrl,
}: {
  title: string;
  description: string;
  company: string;
  location: string;
  city: string;
  state: string;
  employmentType: 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME';
  postedDate: string;
  validThrough: string;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  canonicalUrl: string;
}) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: title,
    description: description,
    datePosted: postedDate,
    validThrough: validThrough,
    employmentType: employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
      sameAs: 'https://www.applyone.co.in/',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: state,
        addressCountry: 'IN',
        streetAddress: location,
      },
    },
    directApply: true,
    url: canonicalUrl,
  };

  if (minSalary && maxSalary) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: salaryCurrency || 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: minSalary,
        maxValue: maxSalary,
        unitText: employmentType === 'INTERNSHIP' ? 'MONTH' : 'YEAR',
      },
    };
  }

  return <JsonLd id={`job-${title.replace(/[^a-zA-Z0-9]/g, '-')}`} schema={schema} />;
}

export function BreadcrumbsSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd id="breadcrumbs" schema={schema} />;
}
