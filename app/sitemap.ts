import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { getTags } from '@/lib/blog';

export const revalidate = 31536000;

const BASE = 'https://techwithbaljeet.web.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch posts with their dates for accurate lastModified
  const [postsSnap, tags] = await Promise.all([
    adminDb
      .collection('posts')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .select('slug', 'updatedAt', 'publishedAt')
      .get(),
    getTags(),
  ]);

  const postEntries = postsSnap.docs.map(doc => {
    const d = doc.data();
    const slug = d.slug ?? doc.id;
    const modified = (d.updatedAt ?? d.publishedAt)?.toDate?.() ?? new Date();
    return {
      url: `${BASE}/post/${slug}`,
      lastModified: modified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    };
  });

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/rss.xml`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.4 },
    ...postEntries,
    ...tags.map(tag => ({
      url: `${BASE}/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];
}
