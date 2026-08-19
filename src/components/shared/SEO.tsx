import React, { useEffect } from 'react';
import { APP_METADATA } from '@/config/appConfig';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
}

export function SEO({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
}: SEOProps) {
  const appName = APP_METADATA.name || 'ApplyOne';

  /*
   * If the supplied title already contains the brand name,
   * don't append it a second time.
   *
   * Example:
   * "ApplyOne - Job Application Automation" stays as-is.
   *
   * Example:
   * "Job Application Automation" becomes:
   * "Job Application Automation | ApplyOne"
   */
  const finalTitle = title
    ? title.toLowerCase().includes(appName.toLowerCase())
      ? title
      : `${title} | ${appName}`
    : APP_METADATA.title || appName;

  const finalDesc =
    description ||
    APP_METADATA.description ||
    'ApplyOne helps students, freshers, and professionals simplify their job search and manage job applications.';

  const finalUrl =
    canonical ||
    (typeof window !== 'undefined'
      ? window.location.href
      : 'https://www.applyone.co.in/');

  const finalImage =
    ogImage ||
    APP_METADATA.ogImage ||
    'https://www.applyone.co.in/og-image.png';

  useEffect(() => {
    /*
     * ---------------------------------------------------------
     * DOCUMENT TITLE
     * ---------------------------------------------------------
     */
    document.title = finalTitle;

    /*
     * ---------------------------------------------------------
     * META TAG HELPERS
     * ---------------------------------------------------------
     */

    const updateMetaTag = (
      attribute: string,
      attributeValue: string,
      content: string,
    ) => {
      if (!content) return;

      let element = document.querySelector(
        `meta[${attribute}="${attributeValue}"]`,
      ) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attributeValue);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    const updateLinkTag = (rel: string, href: string) => {
      if (!href) return;

      let element = document.querySelector(
        `link[rel="${rel}"]`,
      ) as HTMLLinkElement | null;

      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }

      element.setAttribute('href', href);
    };

    /*
     * ---------------------------------------------------------
     * BASIC SEO
     * ---------------------------------------------------------
     */

    updateMetaTag('name', 'description', finalDesc);

    updateMetaTag(
      'name',
      'robots',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    updateMetaTag('name', 'googlebot', 'index, follow');

    updateMetaTag('name', 'bingbot', 'index, follow');

    updateMetaTag('name', 'author', appName);

    updateMetaTag('name', 'application-name', appName);

    /*
     * Helps browsers and search engines understand the
     * preferred language/content context.
     */
    updateMetaTag('http-equiv', 'content-language', 'en');

    /*
     * ---------------------------------------------------------
     * OPEN GRAPH
     * ---------------------------------------------------------
     */

    updateMetaTag('property', 'og:title', finalTitle);

    updateMetaTag('property', 'og:description', finalDesc);

    updateMetaTag('property', 'og:type', ogType);

    updateMetaTag('property', 'og:url', finalUrl);

    updateMetaTag('property', 'og:image', finalImage);

    updateMetaTag('property', 'og:site_name', appName);

    updateMetaTag('property', 'og:locale', 'en_IN');

    /*
     * ---------------------------------------------------------
     * TWITTER / X CARD
     * ---------------------------------------------------------
     */

    updateMetaTag('name', 'twitter:card', 'summary_large_image');

    updateMetaTag('name', 'twitter:title', finalTitle);

    updateMetaTag('name', 'twitter:description', finalDesc);

    updateMetaTag('name', 'twitter:image', finalImage);

    if (APP_METADATA.twitterHandle) {
      updateMetaTag(
        'name',
        'twitter:creator',
        APP_METADATA.twitterHandle,
      );

      updateMetaTag(
        'name',
        'twitter:site',
        APP_METADATA.twitterHandle,
      );
    }

    /*
     * ---------------------------------------------------------
     * CANONICAL URL
     * ---------------------------------------------------------
     */

    updateLinkTag('canonical', finalUrl);

    /*
     * ---------------------------------------------------------
     * THEME COLOR
     * ---------------------------------------------------------
     */

    updateMetaTag('name', 'theme-color', '#ffffff');

    /*
     * ---------------------------------------------------------
     * STRUCTURED DATA / JSON-LD
     *
     * This helps Google understand:
     * - what ApplyOne is
     * - the website name
     * - the website URL
     * - the logo/image
     * ---------------------------------------------------------
     */

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${finalUrl}#organization`,
          name: appName,
          url: 'https://www.applyone.co.in/',
          logo: finalImage,
        },
        {
          '@type': 'WebSite',
          '@id': `${finalUrl}#website`,
          url: 'https://www.applyone.co.in/',
          name: appName,
          description: finalDesc,
          publisher: {
            '@id': `${finalUrl}#organization`,
          },
        },
      ],
    };

    let structuredDataScript = document.getElementById(
      'applyone-seo-structured-data',
    ) as HTMLScriptElement | null;

    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'applyone-seo-structured-data';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }

    structuredDataScript.textContent = JSON.stringify(structuredData);

    /*
     * ---------------------------------------------------------
     * CLEANUP
     *
     * We intentionally keep the SEO tags because this component
     * may be mounted/unmounted during SPA navigation.
     * The next SEO component will simply update them.
     * ---------------------------------------------------------
     */

    return undefined;
  }, [
    finalTitle,
    finalDesc,
    finalUrl,
    finalImage,
    ogType,
    appName,
  ]);

  return null;
}