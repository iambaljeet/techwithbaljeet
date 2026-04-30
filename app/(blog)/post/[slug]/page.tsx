import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPublishedSlugs, getPostsByTag } from '@/lib/blog';
import { formatDate, sanitizeContent } from '@/lib/utils';
import { Clock, ArrowLeft } from 'lucide-react';
import { PostCard } from '@/components/blog/PostCard';
import { PostContent } from '@/components/blog/PostContent';

export const revalidate = 31536000;
export const dynamicParams = true; // SSR new posts not in static params

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  const url = `https://techwithbaljeet.web.app/post/${slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      siteName: 'TechWithBaljeet',
      locale: 'en_US',
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : [{ url: '/og-default.png', width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      tags: post.tags,
      authors: ['https://techwithbaljeet.web.app/#author'],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@baljeet_dev',
      creator: '@baljeet_dev',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : ['/og-default.png'],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // JSON-LD structured data
  const siteUrl = 'https://techwithbaljeet.web.app';
  const postUrl = `${siteUrl}/post/${post.slug}`;
  const readTime = Math.max(1, Math.ceil((post.wordCount || 0) / 200));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${postUrl}/#article`,
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage ?? `${siteUrl}/og-default.png`,
        url: postUrl,
        datePublished: post.publishedAt ?? undefined,
        dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
        author: {
          '@type': 'Person',
          '@id': `${siteUrl}/#author`,
          name: post.author,
          url: 'https://twitter.com/baljeet_dev',
        },
        publisher: {
          '@type': 'Organization',
          '@id': `${siteUrl}/#org`,
          name: 'TechWithBaljeet',
          url: siteUrl,
        },
        isPartOf: { '@id': `${siteUrl}/#website` },
        keywords: post.tags.join(', '),
        wordCount: post.wordCount,
        timeRequired: `PT${readTime}M`,
        inLanguage: 'en-US',
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: post.title, item: postUrl },
        ],
      },
    ],
  };

  // Related posts (same tags, up to 3)
  const relatedPosts = post.tags.length > 0
    ? (await getPostsByTag(post.tags[0])).filter(p => p.id !== post.id).slice(0, 3)
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Articles
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}
                className="rounded-full bg-indigo-950/60 px-3 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-900 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="mb-6 text-3xl font-bold leading-tight text-zinc-100 sm:text-4xl">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              BS
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-200">{post.author}</div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span>{formatDate(post.publishedAt)}</span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>{readTime} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mb-8 overflow-hidden rounded-xl">
            <Image
              src={post.coverImage}
              alt={post.title}
              width={896}
              height={504}
              className="w-full object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <PostContent html={sanitizeContent(post.content, post.title, post.coverImage)} className="prose" />

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-zinc-100">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map(p => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
