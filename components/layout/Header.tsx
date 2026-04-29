'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-transform group-hover:scale-110">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="font-bold text-zinc-100">
            Tech<span className="gradient-text">WithBaljeet</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-indigo-400',
                pathname === link.href ? 'text-indigo-400' : 'text-zinc-400'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu */}
        <button
          className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950 md:hidden">
          <nav className="flex flex-col px-4 py-3">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'py-2 text-sm font-medium transition-colors hover:text-indigo-400',
                  pathname === link.href ? 'text-indigo-400' : 'text-zinc-400'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
