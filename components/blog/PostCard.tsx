import Link from 'next/link';
import Image from 'next/image';
import { formatDateShort } from '@/lib/utils';
import type { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const tagList = post.tags.slice(0, 3);
  const readTime = Math.max(1, Math.ceil((post.wordCount || 0) / 200));

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/20">
      {/* Cover Image */}
      {post.coverImage ? (
        <div className="block aspect-video overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={600}
            height={338}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-indigo-950 via-zinc-900 to-violet-950">
          <span className="text-4xl opacity-30">{'</>'}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Tags - z-10 so they sit above the overlay link */}
        {tagList.length > 0 && (
          <div className="relative z-10 mb-3 flex flex-wrap gap-1.5">
            {tagList.map(tag => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}
                className="rounded-full bg-indigo-950/60 px-2.5 py-0.5 text-xs font-medium text-indigo-400 hover:bg-indigo-900 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title — after:absolute creates the full-card click overlay */}
        <Link
          href={`/post/${post.slug}`}
          className="after:absolute after:inset-0 after:content-['']"
        >
          <h3 className="mb-2 font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-indigo-400 line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{formatDateShort(post.publishedAt)}</span>
          <span>·</span>
          <span>{readTime} min read</span>
        </div>
      </div>
    </article>
  );
}
