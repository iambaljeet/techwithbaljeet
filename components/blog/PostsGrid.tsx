'use client';
import { useState, useTransition } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PostCard } from './PostCard';
import type { Post } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface PostsGridProps {
  initialPosts: Post[];
  total: number;
  excludeId?: string;
}

function firestoreDocToPost(doc: { id: string; data(): Record<string, unknown> }): Post {
  const data = doc.data();
  const toDate = (v: unknown) => v instanceof Timestamp ? v.toDate().toISOString() : null;
  return {
    id: doc.id,
    title: String(data.title ?? ''),
    slug: String(data.slug ?? doc.id),
    excerpt: String(data.excerpt ?? ''),
    content: String(data.content ?? ''),
    coverImage: data.coverImage as string | undefined,
    tags: (data.tags as string[]) ?? [],
    author: String(data.author ?? 'Baljeet Singh'),
    publishedAt: toDate(data.publishedAt),
    updatedAt: toDate(data.updatedAt),
    status: (data.status as 'published' | 'draft') ?? 'published',
    wordCount: Number(data.wordCount ?? 0),
    readTime: Number(data.readTime ?? 1),
  };
}

export function PostsGrid({ initialPosts, total, excludeId }: PostsGridProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [lastDate, setLastDate] = useState<string | null>(
    initialPosts[initialPosts.length - 1]?.publishedAt ?? null
  );

  const hasMore = posts.length < total;

  const loadMore = () => {
    if (!lastDate) return;
    startTransition(async () => {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        startAfter(Timestamp.fromDate(new Date(lastDate))),
        limit(10)
      );
      const snap = await getDocs(q);
      const newPosts = snap.docs.map(firestoreDocToPost).filter(p => p.id !== excludeId);
      setPosts(prev => [...prev, ...newPosts]);
      setLastDate(newPosts[newPosts.length - 1]?.publishedAt ?? null);
    });
  };

  return (
    <div>
      {posts.length === 0 ? (
        <p className="text-center text-zinc-500 py-12">No posts yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-50"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
            ) : (
              'Load More Articles'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
