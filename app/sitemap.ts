import type { MetadataRoute } from 'next';
import { getAllPublishedSlugs, getTags } from '@/lib/blog';

export const revalidate = 31536000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://techwithbaljeet.web.app';
  const [slugs, tags] = await Promise.all([getAllPublishedSlugs(), getTags()]);

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    ...slugs.map(slug => ({
      url: `${base}/post/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...tags.map(tag => ({
      url: `${base}/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
