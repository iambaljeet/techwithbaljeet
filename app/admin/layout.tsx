'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Loader2, LogOut, ExternalLink, Terminal } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && !loading && user === null) {
      router.replace('/admin/login');
    }
  }, [user, loading, router, isLoginPage]);

  // Login page renders its own UI — don't wrap with admin chrome
  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Terminal className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-zinc-100">
              TWB <span className="gradient-text">Admin</span>
            </span>
            <span className="rounded bg-indigo-950 px-2 py-0.5 text-xs text-indigo-400">CMS</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/admin/dashboard"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/posts/new"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              New Post
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:block">{user.email}</span>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> View Blog
            </a>
            <button
              onClick={() => signOut(auth).then(() => router.push('/admin/login'))}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-500/50 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
