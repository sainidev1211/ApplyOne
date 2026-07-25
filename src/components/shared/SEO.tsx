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
  const finalTitle = title ? `${title} | ${APP_METADATA.name}` : APP_METADATA.title;
  const finalDesc = description || APP_METADATA.description;
  const finalUrl = canonical || window.location.href;
  const finalImage = ogImage || APP_METADATA.ogImage;

  useEffect(() => {
    // 1. Update document title
    document.title = finalTitle;

    // Helper to select/create meta tag
    const updateMetaTag = (attribute: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to select/create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    updateMetaTag('name', 'description', finalDesc);
    updateMetaTag('name', 'robots', 'index, follow');

    // 3. Open Graph Tags
    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', finalDesc);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:url', finalUrl);
    updateMetaTag('property', 'og:image', finalImage);
    updateMetaTag('property', 'og:site_name', APP_METADATA.name);

    // 4. Twitter Cards
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', finalDesc);
    updateMetaTag('name', 'twitter:image', finalImage);
    updateMetaTag('name', 'twitter:creator', APP_METADATA.twitterHandle);

    // 5. Canonical Link
    updateLinkTag('canonical', finalUrl);
  }, [finalTitle, finalDesc, ogType, finalUrl, finalImage]);

  return null; // Side-effect only component
}
