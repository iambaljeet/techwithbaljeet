import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostsByTag, getTags } from '@/lib/blog';
import { PostCard } from '@/components/blog/PostCard';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 31536000;
export const dynamicParams = true;

export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map(t => ({ tag: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded} Articles`,
    description: `Browse all articles tagged with ${decoded} on TechWithBaljeet.`,
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await getPostsByTag(decoded);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-indigo-400 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        All Articles
      </Link>

      <div className="mb-10">
        <div className="mb-2 text-sm text-indigo-400">Tag</div>
        <h1 className="text-3xl font-bold text-zinc-100">#{decoded}</h1>
        <p className="mt-2 text-zinc-500">{posts.length} article{posts.length !== 1 ? 's' : ''}</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-zinc-500">No posts found for this tag.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
