import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { BreadcrumbsSchema } from '@/components/shared/JsonLd';
import { BLOG_POSTS, BlogPost } from '@/data/blogPosts';

export default function BlogIndex() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    BLOG_POSTS.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All') return BLOG_POSTS;
    return BLOG_POSTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <>
      <SEO
        title="Career Guides, Resume Tips & Job Search Insights"
        description="Comprehensive guides for Indian freshers and professionals. Learn how to craft ATS-friendly resumes, ace HR interviews, and automate your job applications."
        canonical="https://www.applyone.co.in/blog"
      />

      <BreadcrumbsSchema
        items={[
          { name: 'Home', url: 'https://www.applyone.co.in/' },
          { name: 'Career Guides', url: 'https://www.applyone.co.in/blog' },
        ]}
      />

      <div className="py-16 bg-slate-50/50">
        <Container>
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              ApplyOne Career Hub
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary-light">
              Career Guides &amp;{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Job Search Insights
              </span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary-light">
              Actionable advice on ATS resume optimization, HR interviews, and modern job search automation for students, freshers, and professionals in India.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-border-light'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredPosts.map((post) => (
              <Card
                key={post.slug}
                className="flex flex-col justify-between border border-border-light bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200 rounded-2xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                      {post.category}
                    </span>
                    <span>{post.readTime}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary-light hover:text-blue-600 transition-colors leading-snug">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="text-sm text-text-secondary-light leading-relaxed line-clamp-3">
                    {post.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 block">{post.author.name}</span>
                    <span>{new Date(post.publishDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <Link to={`/blog/${post.slug}`}>
                    <Button variant="outline" size="sm">
                      Read Guide &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Tired of Applying to Hundreds of Jobs Manually?
            </h3>
            <p className="max-w-2xl mx-auto text-blue-100 text-sm sm:text-base mb-6">
              ApplyOne automatically matches you with verified positions, optimizes your resume for applicant tracking systems, and submits applications on your behalf.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 font-bold px-6 py-3">
                  View Plans &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
