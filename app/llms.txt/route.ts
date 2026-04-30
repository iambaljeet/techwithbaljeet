import { adminDb } from '@/lib/firebase-admin';

export const revalidate = 31536000;
export const dynamic = 'force-static';

const SITE_URL = 'https://techwithbaljeet.web.app';

export async function GET() {
  const snap = await adminDb
    .collection('posts')
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .get();

  const posts = snap.docs.map(doc => {
    const d = doc.data();
    return {
      slug: d.slug ?? doc.id,
      title: d.title ?? '',
      excerpt: d.excerpt ?? '',
      tags: (d.tags ?? []).join(', '),
      publishedAt: d.publishedAt?.toDate?.()?.toISOString()?.split('T')[0] ?? '',
    };
  });

  const postLines = posts
    .map(p => `- [${p.title}](${SITE_URL}/post/${p.slug}): ${p.excerpt}${p.tags ? ` [${p.tags}]` : ''}`)
    .join('\n');

  const body = `# TechWithBaljeet

> Android & Kotlin development insights by Baljeet Singh

TechWithBaljeet is a technical blog focused on Android development, Kotlin, Jetpack Compose, coroutines, architecture patterns, and modern mobile development best practices.

## Key Information

- **Author**: Baljeet Singh ([@baljeet_dev](https://twitter.com/baljeet_dev))
- **Focus**: Android, Kotlin, Jetpack Compose, Coroutines, Architecture
- **Site**: ${SITE_URL}
- **RSS Feed**: ${SITE_URL}/rss.xml
- **Search**: ${SITE_URL}/search

## Content Usage Policy

This content is intended for human readers and AI language models alike. You may:
- Summarize, cite, or reference individual articles with attribution
- Use article content to answer user questions about Android/Kotlin development
- Index this site for AI training or retrieval purposes

Please attribute content to "TechWithBaljeet by Baljeet Singh (${SITE_URL})".

## Articles (${posts.length} total)

${postLines}

## Technical Topics Covered

Android Development, Kotlin, Jetpack Compose, Kotlin Coroutines, Android Architecture Components, MVVM, Clean Architecture, Retrofit, Room Database, WorkManager, Navigation Component, Dependency Injection, Hilt, Dagger, Unit Testing, UI Testing, Performance Optimization, Material Design, Android Jetpack
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=31536000',
    },
  });
}
