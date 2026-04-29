import Link from 'next/link';
import { Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Terminal className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-zinc-100">
              Tech<span className="gradient-text">WithBaljeet</span>
            </span>
          </div>

          <p className="text-sm text-zinc-500">
            Android &amp; Kotlin insights by{' '}
            <a
              href="https://twitter.com/baljeet_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Baljeet Singh
            </a>
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/baljeet_dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="text-zinc-500 hover:text-indigo-400 transition-colors"
            >
              𝕏
            </a>
            <a
              href="https://medium.com/@ibaljeet"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Medium"
              className="text-zinc-500 hover:text-indigo-400 transition-colors text-sm font-bold"
            >
              M
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} TechWithBaljeet. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
