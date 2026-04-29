import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { ArrowRight, Clock } from 'lucide-react';

interface PostHeroProps {
  post: Post;
}

export function PostHero({ post }: PostHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-950 via-zinc-900 to-violet-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="max-w-3xl">
          {/* Label */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
            </span>
            Latest Article
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map(tag => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="mb-6 text-lg leading-relaxed text-zinc-300 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Meta + CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                BS
              </div>
              <div>
                <div className="font-medium text-zinc-200">Baljeet Singh</div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{post.readTime} min read</span>
                </div>
              </div>
            </div>

            <Link
              href={`/post/${post.slug}`}
              className="ml-auto flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:bg-indigo-500 hover:gap-3"
            >
              Read Article
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
