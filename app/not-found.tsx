import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-8xl font-black gradient-text">404</div>
      <h1 className="text-2xl font-bold text-zinc-100">Page Not Found</h1>
      <p className="text-zinc-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
        Go Home
      </Link>
    </div>
  );
}
