import type { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML from TipTap
  coverImage?: string;
  tags: string[];
  author: string;
  publishedAt: string | null; // ISO string — safe across JSON cache boundaries
  updatedAt: string | null;   // ISO string
  status: 'published' | 'draft';
  wordCount: number;
  readTime: number; // minutes
  mediumUrl?: string;
}

export interface PostFirestore extends Omit<Post, 'publishedAt' | 'updatedAt'> {
  publishedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Tag {
  slug: string;
  name: string;
  count: number;
}

export interface PaginatedPosts {
  posts: Post[];
  hasMore: boolean;
  lastDocId?: string;
}

export type PostStatus = 'published' | 'draft';
