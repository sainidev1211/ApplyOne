import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOG_POSTS } from '../src/data/blogPosts.ts';
import { getProgrammaticCombos, getInternshipCities } from '../src/data/programmaticJobs.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

const BASE_URL = 'https://www.applyone.co.in';
const TODAY = new Date().toISOString().split('T')[0];

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

function buildUrlXml(urls: SitemapUrl[]): string {
  const urlNodes = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>
`;
}

function buildIndexXml(sitemaps: Array<{ loc: string; lastmod: string }>): string {
  const sitemapNodes = sitemaps
    .map(
      (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNodes}
</sitemapindex>
`;
}

export function generateSitemaps() {
  console.log('🗺️  Generating dynamic sitemaps for ApplyOne...');

  // 1. Core pages
  const coreUrls: SitemapUrl[] = [
    { loc: `${BASE_URL}/`, lastmod: TODAY, changefreq: 'daily', priority: '1.0' },
    { loc: `${BASE_URL}/blog`, lastmod: TODAY, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/jobs`, lastmod: TODAY, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/privacy`, lastmod: '2026-08-01', changefreq: 'monthly', priority: '0.3' },
    { loc: `${BASE_URL}/terms`, lastmod: '2026-08-01', changefreq: 'monthly', priority: '0.3' },
  ];

  // 2. Blog posts
  const blogUrls: SitemapUrl[] = BLOG_POSTS.map((post) => ({
    loc: `${BASE_URL}/blog/${post.slug}`,
    lastmod: post.publishDate || TODAY,
    changefreq: 'weekly',
    priority: '0.8',
  }));

  // 3. Programmatic job combos (only active/verified combinations)
  const combos = getProgrammaticCombos();
  const internshipCities = getInternshipCities();

  const jobUrls: SitemapUrl[] = [
    ...combos.map((c) => ({
      loc: `${BASE_URL}/jobs/${c.city}/${c.role}`,
      lastmod: TODAY,
      changefreq: 'daily' as const,
      priority: '0.8',
    })),
    ...internshipCities.map((ic) => ({
      loc: `${BASE_URL}/internships/${ic.city}`,
      lastmod: TODAY,
      changefreq: 'daily' as const,
      priority: '0.8',
    })),
  ];

  const allUrls = [...coreUrls, ...blogUrls, ...jobUrls];

  console.log(`  • Core URLs: ${coreUrls.length}`);
  console.log(`  • Blog Guides URLs: ${blogUrls.length}`);
  console.log(`  • Verified Job & Internship Landing URLs: ${jobUrls.length}`);
  console.log(`  • Total indexed URLs: ${allUrls.length}`);

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Generate sub-sitemaps for modular indexation
  const coreXml = buildUrlXml(coreUrls);
  const blogXml = buildUrlXml(blogUrls);
  const jobsXml = buildUrlXml(jobUrls);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-core.xml'), coreXml, 'utf-8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-blog.xml'), blogXml, 'utf-8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-jobs.xml'), jobsXml, 'utf-8');

  // Generate sitemap_index.xml referencing sub-sitemaps
  const indexXml = buildIndexXml([
    { loc: `${BASE_URL}/sitemap-core.xml`, lastmod: TODAY },
    { loc: `${BASE_URL}/sitemap-blog.xml`, lastmod: TODAY },
    { loc: `${BASE_URL}/sitemap-jobs.xml`, lastmod: TODAY },
  ]);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap_index.xml'), indexXml, 'utf-8');

  // Also write the unified sitemap.xml for direct crawlers
  const unifiedXml = buildUrlXml(allUrls);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), unifiedXml, 'utf-8');

  console.log('✅ Sitemaps generated successfully:');
  console.log('   - public/sitemap.xml (unified)');
  console.log('   - public/sitemap_index.xml (index)');
  console.log('   - public/sitemap-core.xml');
  console.log('   - public/sitemap-blog.xml');
  console.log('   - public/sitemap-jobs.xml');
}

// Execute immediately when run as script
generateSitemaps();
