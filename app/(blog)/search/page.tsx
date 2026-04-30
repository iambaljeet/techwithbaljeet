'use client';
import { useState, useEffect, useTransition } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PostCard } from '@/components/blog/PostCard';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';

const PAGE_SIZE = 10;

function toPost(doc: { id: string; data(): Record<string, unknown> }): Post {
  const d = doc.data();
  const toDate = (v: unknown) => v instanceof Timestamp ? v.toDate().toISOString() : null;
  return {
    id: doc.id, title: String(d.title ?? ''), slug: String(d.slug ?? doc.id),
    excerpt: String(d.excerpt ?? ''), content: String(d.content ?? ''),
    coverImage: d.coverImage as string | undefined, tags: (d.tags as string[]) ?? [],
    author: String(d.author ?? 'Baljeet Singh'), publishedAt: toDate(d.publishedAt),
    updatedAt: toDate(d.updatedAt), status: 'published',
    wordCount: Number(d.wordCount ?? 0), readTime: Number(d.readTime ?? 1),
  };
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filtered, setFiltered] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const q = query(collection(db, 'posts'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'));
    getDocs(q).then(snap => {
      const posts = snap.docs.map(toPost);
      setAllPosts(posts);
      setFiltered(posts);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    startTransition(() => {
      setPage(0);
      if (!searchQuery.trim()) { setFiltered(allPosts); return; }
      const q = searchQuery.toLowerCase();
      setFiltered(allPosts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      ));
    });
  }, [searchQuery, allPosts]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const goTo = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

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
            {searchQuery
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchQuery}"`
              : `${allPosts.length} articles`}
            {totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
          </p>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">No articles found. Try a different search term.</p>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map(post => <PostCard key={post.id} post={post} />)}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    onClick={() => goTo(page - 1)}
                    disabled={page === 0 || isPending}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-indigo-500 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i)
                      .slice(Math.max(0, page - 2), page + 3)
                      .map(i => (
                        <button
                          key={i}
                          onClick={() => goTo(i)}
                          className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                            i === page
                              ? 'bg-indigo-600 text-white'
                              : 'border border-zinc-700 text-zinc-400 hover:border-indigo-500 hover:text-indigo-400'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                  </div>

                  <button
                    onClick={() => goTo(page + 1)}
                    disabled={page >= totalPages - 1 || isPending}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-indigo-500 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
