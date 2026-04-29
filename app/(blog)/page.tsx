import type { Metadata } from 'next';
import { getFeaturedPost, getPosts, getTags } from '@/lib/blog';
import { PostHero } from '@/components/blog/PostHero';
import { PostsGrid } from '@/components/blog/PostsGrid';
import Link from 'next/link';

export const revalidate = 31536000; // 1 year ISR — revalidated on-demand by admin actions

export const metadata: Metadata = {
  title: 'TechWithBaljeet — Android & Kotlin Blog',
  description: 'Deep dives into Android development, Kotlin, Jetpack Compose, coroutines, and modern app architecture.',
};

export default async function HomePage() {
  const [featured, { posts, total }, tags] = await Promise.all([
    getFeaturedPost(),
    getPosts(0, 11), // fetch 11 so we can show featured + 10 grid items
    getTags(),
  ]);

  // Exclude featured from grid
  const gridPosts = featured
    ? posts.filter(p => p.id !== featured.id).slice(0, 10)
    : posts.slice(0, 10);

  const gridTotal = featured ? total - 1 : total;

  return (
    <>
      {/* Hero */}
      {featured && <PostHero post={featured} />}

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Tags cloud */}
        {tags.length > 0 && (
          <div className="mb-12 flex flex-wrap gap-2">
            {tags.map(tag => (
              <Link
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-400 transition-all hover:border-indigo-500/50 hover:bg-indigo-950/30 hover:text-indigo-400"
              >
                {tag.name}
                <span className="ml-1.5 text-zinc-600">{tag.count}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Posts grid heading */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">All Articles</h2>
            <p className="mt-1 text-sm text-zinc-500">{total} posts published</p>
          </div>
        </div>

        {/* Posts grid with load more */}
        <PostsGrid
          initialPosts={gridPosts}
          total={gridTotal}
          excludeId={featured?.id}
        />
      </div>
    </>
  );
}
