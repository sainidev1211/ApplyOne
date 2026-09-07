import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/shared/SEO';
import { BlogPostSchema, BreadcrumbsSchema } from '@/components/shared/JsonLd';
import { BLOG_POSTS, BlogPost } from '@/data/blogPosts';

/**
 * Renders inline markdown text (bold, links, code, italic) to React elements
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex tokenizes [text](url), **bold**, *italic*, `code`
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      // [text](url)
      const linkText = match[2];
      const linkHref = match[3];
      const isInternal = linkHref.startsWith('/');
      if (isInternal) {
        elements.push(
          <Link
            key={match.index}
            to={linkHref}
            className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
          >
            {linkText}
          </Link>
        );
      } else {
        elements.push(
          <a
            key={match.index}
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
          >
            {linkText}
          </a>
        );
      }
    } else if (match[4]) {
      // **bold**
      elements.push(<strong key={match.index} className="font-bold text-slate-900">{match[4]}</strong>);
    } else if (match[5]) {
      // *italic*
      elements.push(<em key={match.index} className="italic text-slate-700">{match[5]}</em>);
    } else if (match[6]) {
      // `code`
      elements.push(
        <code key={match.index} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
          {match[6]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements;
}

/**
 * Custom clean markdown block parser
 */
function MarkdownArticleRenderer({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const rawLines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let listItems: string[] = [];
    let isOrderedList = false;

    const flushList = () => {
      if (listItems.length === 0) return;
      if (isOrderedList) {
        nodes.push(
          <ol key={`ol-${nodes.length}`} className="list-decimal list-inside space-y-2 my-4 text-slate-700 leading-relaxed pl-2">
            {listItems.map((item, i) => (
              <li key={i}>{renderInlineMarkdown(item)}</li>
            ))}
          </ol>
        );
      } else {
        nodes.push(
          <ul key={`ul-${nodes.length}`} className="list-disc list-inside space-y-2 my-4 text-slate-700 leading-relaxed pl-2">
            {listItems.map((item, i) => (
              <li key={i}>{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
      isOrderedList = false;
    };

    const flushTable = () => {
      if (tableRows.length === 0) return;
      const header = tableRows[0];
      const body = tableRows.slice(1);
      nodes.push(
        <div key={`table-${nodes.length}`} className="overflow-x-auto my-6 border border-border-light rounded-xl">
          <table className="min-w-full divide-y divide-border-light text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-4 py-3 font-semibold text-slate-800">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light bg-white">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-slate-600">
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();

      // Check table
      if (line.startsWith('|') && line.endsWith('|')) {
        // Divider row like |---|---|
        if (/^\|[-:\s|]+\|$/.test(line)) {
          continue;
        }
        flushList();
        inTable = true;
        const cells = line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Check lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (isOrderedList && listItems.length > 0) flushList();
        isOrderedList = false;
        listItems.push(line.replace(/^[-*]\s+/, ''));
        continue;
      } else if (/^\d+\.\s+/.test(line)) {
        if (!isOrderedList && listItems.length > 0) flushList();
        isOrderedList = true;
        listItems.push(line.replace(/^\d+\.\s+/, ''));
        continue;
      } else if (listItems.length > 0) {
        flushList();
      }

      if (!line) continue;

      // H1 (Skipped if matches main title, but render if unique)
      if (line.startsWith('# ')) {
        continue; // Primary H1 is rendered explicitly in header
      } else if (line.startsWith('## ')) {
        nodes.push(
          <h2 key={i} className="text-2xl sm:text-3xl font-bold text-slate-900 mt-10 mb-4 tracking-tight border-b border-slate-100 pb-2">
            {line.replace(/^##\s+/, '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        nodes.push(
          <h3 key={i} className="text-xl sm:text-2xl font-semibold text-slate-800 mt-6 mb-3">
            {line.replace(/^###\s+/, '')}
          </h3>
        );
      } else if (line === '---') {
        nodes.push(<hr key={i} className="my-8 border-slate-200" />);
      } else if (line.startsWith('> ')) {
        nodes.push(
          <blockquote key={i} className="my-4 border-l-4 border-blue-500 bg-blue-50/50 p-4 rounded-r-lg text-slate-700 italic">
            {renderInlineMarkdown(line.replace(/^>\s+/, ''))}
          </blockquote>
        );
      } else {
        nodes.push(
          <p key={i} className="text-base sm:text-lg text-slate-700 leading-relaxed my-4">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    }

    flushList();
    flushTable();

    return nodes;
  }, [content]);

  return <div className="space-y-1">{blocks}</div>;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = BLOG_POSTS.filter((p) => post.relatedSlugs.includes(p.slug));
  const canonicalUrl = `https://www.applyone.co.in/blog/${post.slug}`;

  return (
    <>
      <SEO
        title={post.metaTitle}
        description={post.metaDescription}
        canonical={canonicalUrl}
      />

      <BlogPostSchema
        title={post.title}
        description={post.metaDescription}
        publishDate={post.publishDate}
        canonicalUrl={canonicalUrl}
        authorName={post.author.name}
        keywords={post.keywords}
      />

      <BreadcrumbsSchema
        items={[
          { name: 'Home', url: 'https://www.applyone.co.in/' },
          { name: 'Career Guides', url: 'https://www.applyone.co.in/blog' },
          { name: post.title, url: canonicalUrl },
        ]}
      />

      <article className="py-12 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-8">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-blue-600 transition-colors">Career Guides</Link>
              <span>/</span>
              <span className="text-slate-800 font-medium truncate max-w-xs sm:max-w-md">{post.category}</span>
            </nav>

            {/* Header / Title */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                  {post.category}
                </span>
                <span className="text-xs text-slate-500">• {post.readTime}</span>
                <span className="text-xs text-slate-500">
                  • Published {new Date(post.publishDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {post.title}
              </h1>

              {/* Author byline */}
              <div className="flex items-center space-x-3 pt-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  AO
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{post.author.name}</p>
                  <p className="text-xs text-slate-500">{post.author.role}</p>
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <Card className="p-6 bg-slate-50 border border-blue-100 rounded-2xl mb-10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                Key Takeaway
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                {post.summary}
              </p>
            </Card>

            {/* Article Content */}
            <div className="prose prose-slate max-w-none">
              <MarkdownArticleRenderer content={post.content} />
            </div>

            {/* In-Article Action Banner */}
            <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900">
                  Is your resume ready for corporate ATS parsers?
                </h4>
                <p className="text-sm text-slate-600">
                  Upload your resume to our AI-powered ATS checker and get an instant score with keyword optimization insights.
                </p>
              </div>
              <Link to="/dashboard/ats-checker" className="flex-shrink-0">
                <Button variant="gradient" size="md">
                  Check Resume Score Free
                </Button>
              </Link>
            </div>

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <div className="mt-16 pt-10 border-t border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Recommended Career Guides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {relatedPosts.map((related) => (
                    <Card
                      key={related.slug}
                      className="p-6 border border-border-light bg-white hover:shadow-md transition-shadow rounded-xl flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-blue-600">{related.category}</span>
                        <h4 className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors">
                          <Link to={`/blog/${related.slug}`}>{related.title}</Link>
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{related.summary}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>{related.readTime}</span>
                        <Link to={`/blog/${related.slug}`} className="text-blue-600 font-semibold hover:underline">
                          Read &rarr;
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Back to guides link */}
            <div className="mt-12 text-center">
              <Link to="/blog">
                <Button variant="outline" size="sm">
                  &larr; Back to All Career Guides
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </article>
    </>
  );
}
