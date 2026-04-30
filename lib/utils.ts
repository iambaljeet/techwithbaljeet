import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

export function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Strips duplicate title <h1> and cover image <figure>/<img> that
 * Medium exports embed inside the HTML content body. The post detail
 * page already renders these separately above the content.
 */
export function sanitizeContent(html: string, title: string, coverImage?: string): string {
  let result = html;

  // Remove leading <h1> that matches the post title (case-insensitive)
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  result = result.replace(
    new RegExp(`^\\s*<h1[^>]*>\\s*${escapedTitle}\\s*<\\/h1>`, 'i'),
    ''
  );
  // Also remove any leading <h1> regardless of text (Medium always puts title first)
  result = result.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/, '');

  // Remove leading <figure> containing the cover image URL
  if (coverImage) {
    const escapedSrc = coverImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`^\\s*<figure[^>]*>[\\s\\S]*?${escapedSrc}[\\s\\S]*?<\\/figure>`),
      ''
    );
  }

  // Remove any leading <figure> that is the very first element (common Medium pattern)
  result = result.replace(/^\s*<figure[^>]*>[\s\S]*?<\/figure>/, '');

  return result.trim();
}
