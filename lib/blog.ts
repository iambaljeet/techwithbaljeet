import { unstable_cache } from 'next/cache';
import { adminDb } from './firebase-admin';
import type { Post, Tag } from './types';

export const PAGE_SIZE = 10;

function docToPost(doc: FirebaseFirestore.DocumentSnapshot): Post {
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title ?? '',
    slug: data.slug ?? doc.id,
    excerpt: data.excerpt ?? '',
    content: data.content ?? '',
    coverImage: data.coverImage,
    tags: data.tags ?? [],
    author: data.author ?? 'Baljeet Singh',
    publishedAt: data.publishedAt?.toDate().toISOString() ?? null,
    updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
    status: data.status ?? 'draft',
    wordCount: data.wordCount ?? 0,
    readTime: data.readTime ?? 1,
    mediumUrl: data.mediumUrl,
  };
}

// Cached: all published slugs (for generateStaticParams)
export const getAllPublishedSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const snapshot = await adminDb
      .collection('posts')
      .where('status', '==', 'published')
      .select('slug')
      .get();
    return snapshot.docs.map(doc => doc.data().slug ?? doc.id);
  },
  ['all-slugs'],
  { revalidate: 31536000, tags: ['posts'] }
);

// Cached: featured (latest published) post
export const getFeaturedPost = unstable_cache(
  async (): Promise<Post | null> => {
    const snapshot = await adminDb
      .collection('posts')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return docToPost(snapshot.docs[0]);
  },
  ['featured-post'],
  { revalidate: 31536000, tags: ['posts'] }
);

// Cached: paginated posts (excludes featured/first post)
export const getPosts = unstable_cache(
  async (skip = 0, limit = PAGE_SIZE): Promise<{ posts: Post[]; total: number }> => {
    const [postsSnap, countSnap] = await Promise.all([
      adminDb
        .collection('posts')
        .where('status', '==', 'published')
        .orderBy('publishedAt', 'desc')
        .offset(skip)
        .limit(limit)
        .get(),
      adminDb
        .collection('posts')
        .where('status', '==', 'published')
        .count()
        .get(),
    ]);
    return {
      posts: postsSnap.docs.map(docToPost),
      total: countSnap.data().count,
    };
  },
  ['posts-paginated'],
  { revalidate: 31536000, tags: ['posts'] }
);

// Cached: single post by slug
export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  return unstable_cache(
    async () => {
      const snapshot = await adminDb
        .collection('posts')
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return docToPost(snapshot.docs[0]);
    },
    [`post-${slug}`],
    { revalidate: 31536000, tags: [`post-${slug}`, 'posts'] }
  )();
};

// Cached: posts by tag
export const getPostsByTag = async (tag: string): Promise<Post[]> => {
  return unstable_cache(
    async () => {
      const snapshot = await adminDb
        .collection('posts')
        .where('status', '==', 'published')
        .where('tags', 'array-contains', tag)
        .orderBy('publishedAt', 'desc')
        .get();
      return snapshot.docs.map(docToPost);
    },
    [`tag-${tag}`],
    { revalidate: 31536000, tags: [`tag-${tag}`, 'posts'] }
  )();
};

// Cached: all tags
export const getTags = unstable_cache(
  async (): Promise<Tag[]> => {
    const snapshot = await adminDb
      .collection('tags')
      .orderBy('count', 'desc')
      .get();
    if (snapshot.empty) {
      // Fallback: compute tags from posts
      const postsSnap = await adminDb
        .collection('posts')
        .where('status', '==', 'published')
        .get();
      const tagMap = new Map<string, number>();
      postsSnap.docs.forEach(doc => {
        const tags: string[] = doc.data().tags ?? [];
        tags.forEach(t => tagMap.set(t, (tagMap.get(t) ?? 0) + 1));
      });
      return Array.from(tagMap.entries())
        .map(([name, count]) => ({ slug: name.toLowerCase().replace(/\s+/g, '-'), name, count }))
        .sort((a, b) => b.count - a.count);
    }
    return snapshot.docs.map(doc => ({
      slug: doc.id,
      name: doc.data().name ?? doc.id,
      count: doc.data().count ?? 0,
    }));
  },
  ['tags'],
  { revalidate: 31536000, tags: ['tags', 'posts'] }
);

// Not cached: all posts for admin (includes drafts) - called client-side with Firebase JS SDK
// See lib/admin-blog.ts for client-side admin operations
