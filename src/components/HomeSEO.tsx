import { useEffect } from 'react';

const SITE_URL = 'https://www.applyone.co.in';

export default function HomeSEO() {
  useEffect(() => {
    // ─────────────────────────────────────────────
    // Basic SEO
    // ─────────────────────────────────────────────

    document.title = 'AI Job Application Automation | ApplyOne';

    const setMeta = (
      attribute: 'name' | 'property',
      key: string,
      content: string,
    ) => {
      let element = document.head.querySelector(
        `meta[${attribute}="${key}"]`,
      ) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    setMeta(
      'name',
      'description',
      'ApplyOne helps students, freshers, and professionals automate job applications, optimize resumes, check ATS compatibility, and track applications in one platform.',
    );

    setMeta(
      'name',
      'robots',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    setMeta(
      'name',
      'keywords',
      'AI job application automation, job application automation, automated job applications, AI resume checker, ATS resume checker, resume optimization, job application tracker, job search automation, internship application automation, ApplyOne',
    );

    setMeta('name', 'author', 'ApplyOne');

    // ─────────────────────────────────────────────
    // Open Graph
    // ─────────────────────────────────────────────

    setMeta('property', 'og:title', 'AI Job Application Automation | ApplyOne');

    setMeta(
      'property',
      'og:description',
      'Automate your job search and applications with ApplyOne. Find opportunities, optimize your resume, check ATS compatibility, and track applications.',
    );

    setMeta('property', 'og:type', 'website');

    setMeta('property', 'og:url', SITE_URL);

    setMeta('property', 'og:site_name', 'ApplyOne');

    // ─────────────────────────────────────────────
    // Twitter / social sharing
    // ─────────────────────────────────────────────

    setMeta('name', 'twitter:card', 'summary_large_image');

    setMeta(
      'name',
      'twitter:title',
      'AI Job Application Automation | ApplyOne',
    );

    setMeta(
      'name',
      'twitter:description',
      'Automate job applications, optimize your resume, check ATS compatibility, and track applications with ApplyOne.',
    );

    // ─────────────────────────────────────────────
    // Canonical URL
    // ─────────────────────────────────────────────

    let canonical = document.head.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = SITE_URL + '/';

    // ─────────────────────────────────────────────
    // Structured Data
    // ─────────────────────────────────────────────

    const structuredDataId = 'applyone-homepage-schema';

    // Remove previous copy if React remounts this component.
    const existingSchema = document.getElementById(structuredDataId);

    if (existingSchema) {
      existingSchema.remove();
    }

    const schema = document.createElement('script');
    schema.id = structuredDataId;
    schema.type = 'application/ld+json';

    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'ApplyOne',
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.ico`,
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: 'ApplyOne',
          publisher: {
            '@id': `${SITE_URL}/#organization`,
          },
        },
        {
          '@type': 'SoftwareApplication',
          '@id': `${SITE_URL}/#application`,
          name: 'ApplyOne',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: SITE_URL,
          description:
            'AI-powered job application automation platform for students, freshers, and professionals.',
          publisher: {
            '@id': `${SITE_URL}/#organization`,
          },
        },
      ],
    });

    document.head.appendChild(schema);

    // Cleanup when component unmounts.
    return () => {
      const schemaElement = document.getElementById(structuredDataId);

      if (schemaElement) {
        schemaElement.remove();
      }
    };
  }, []);

  // IMPORTANT:
  // This component does not render anything.
  // Therefore it will not change your existing UI/design.
  return null;
}