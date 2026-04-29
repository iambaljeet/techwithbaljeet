'use client';
import { useState, useEffect, useTransition } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PostCard } from '@/components/blog/PostCard';
import { Search, Loader2 } from 'lucide-react';
import type { Post } from '@/lib/types';

function toPost(doc: { id: string; data(): Record<string, unknown> }): Post {
  const d = doc.data();
  const toDate = (v: unknown) => v instanceof Timestamp ? v.toDate().toISOString() : null;
  return {
    id: doc.id, title: String(d.title ?? ''), slug: String(d.slug ?? doc.id),
    excerpt: String(d.excerpt ?? ''), content: String(d.content ?? ''),
    coverImage: d.coverImage as string | undefined, tags: (d.tags as string[]) ?? [],
    author: String(d.author ?? 'Baljeet Singh'), publishedAt: toDate(d.publishedAt),
    updatedAt: toDate(d.updatedAt), status: 'published', views: Number(d.views ?? 0),
    wordCount: Number(d.wordCount ?? 0), readTime: Number(d.readTime ?? 1),
    mediumUrl: d.mediumUrl as string | undefined,
  };
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filtered, setFiltered] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load all published posts once
  useEffect(() => {
    const q = query(collection(db, 'posts'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'));
    getDocs(q).then(snap => {
      const posts = snap.docs.map(toPost);
      setAllPosts(posts);
      setFiltered(posts);
      setLoaded(true);
    });
  }, []);

  // Filter on query change
  useEffect(() => {
    startTransition(() => {
      if (!searchQuery.trim()) {
        setFiltered(allPosts);
        return;
      }
      const q = searchQuery.toLowerCase();
      setFiltered(
        allPosts.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
        )
      );
    });
  }, [searchQuery, allPosts]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="mb-6 text-3xl font-bold text-zinc-100">Search</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search articles, tags…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3.5 pl-12 pr-4 text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
        </div>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-zinc-500">
            {searchQuery ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchQuery}"` : `${allPosts.length} articles`}
          </p>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">No articles found. Try a different search term.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
