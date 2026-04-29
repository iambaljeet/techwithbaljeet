'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { adminGetPosts, adminSearchPosts, adminDeletePost } from '@/lib/admin-blog';
import { triggerRevalidation, getPostRevalidationPayload } from '@/lib/revalidate';
import { formatDateShort } from '@/lib/utils';
import type { Post } from '@/lib/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  Plus, Search, Trash2, Edit, Eye, EyeOff, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Cursor per page (stored in ref to avoid triggering re-renders)
  const cursorsRef = useRef<(DocumentSnapshot | null)[]>([null]);

  // Load paginated posts
  useEffect(() => {
    if (searchQuery) return;

    let cancelled = false;
    setLoading(true);

    adminGetPosts(PAGE_SIZE, cursorsRef.current[page] ?? undefined)
      .then(result => {
        if (cancelled) return;
        setPosts(result.posts);
        setHasMore(result.hasMore);
        if (result.hasMore && result.lastDoc) {
          cursorsRef.current[page + 1] = result.lastDoc;
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, searchQuery]);

  // Search
  useEffect(() => {
    if (!searchQuery) {
      // Reset to page 0 when search is cleared; the page effect above will reload
      setPage(0);
      cursorsRef.current = [null];
      return;
    }

    let cancelled = false;
    setLoading(true);

    adminSearchPosts(searchQuery)
      .then(results => {
        if (cancelled) return;
        setPosts(results);
        setHasMore(false);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [searchQuery]);

  const handleDelete = async (post: Post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    setDeleting(post.id);
    try {
      await adminDeletePost(post.id);
      const payload = getPostRevalidationPayload(post.slug, post.tags);
      await triggerRevalidation(payload);
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Posts</h1>
          <p className="text-sm text-zinc-500">Manage all blog posts</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          placeholder="Search posts by title, tags…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Title</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-zinc-400 sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-zinc-400 md:table-cell">Tags</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-zinc-400 lg:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    {searchQuery ? 'No posts match your search.' : 'No posts yet. Create your first post!'}
                  </td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="max-w-xs font-medium text-zinc-200 line-clamp-1">{post.title}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 sm:hidden">{post.status}</div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-950/50 text-green-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {post.status === 'published'
                          ? <Eye className="h-3 w-3" />
                          : <EyeOff className="h-3 w-3" />}
                        {post.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="rounded bg-indigo-950/50 px-1.5 py-0.5 text-xs text-indigo-400">
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-zinc-600">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-xs text-zinc-500">{formatDateShort(post.publishedAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/post/${post.slug}`}
                          target="_blank"
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
                          title="View post"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-indigo-950 hover:text-indigo-400 transition-colors"
                          title="Edit post"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deleting === post.id}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-red-950/30 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete post"
                        >
                          {deleting === post.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!searchQuery && (hasMore || page > 0) && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-xs text-zinc-500">Page {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
