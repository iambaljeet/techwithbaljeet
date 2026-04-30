import { adminDb } from '@/lib/firebase-admin';

export const revalidate = 31536000;
export const dynamic = 'force-static';

const SITE_URL = 'https://techwithbaljeet.web.app';
const SITE_NAME = 'TechWithBaljeet';
const SITE_DESC = 'Android & Kotlin development insights by Baljeet Singh';
const AUTHOR = 'Baljeet Singh';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const snap = await adminDb
    .collection('posts')
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .limit(50)
    .get();

  const items = snap.docs
    .map(doc => {
      const d = doc.data();
      const pubDate = d.publishedAt?.toDate?.() ?? new Date();
      const slug = d.slug ?? doc.id;
      return `
    <item>
      <title>${escapeXml(d.title ?? '')}</title>
      <link>${SITE_URL}/post/${slug}</link>
      <guid isPermaLink="true">${SITE_URL}/post/${slug}</guid>
      <description>${escapeXml(d.excerpt ?? '')}</description>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <author>noreply@techwithbaljeet.web.app (${AUTHOR})</author>
      ${(d.tags ?? []).map((t: string) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
      ${d.coverImage ? `<enclosure url="${escapeXml(d.coverImage)}" type="image/jpeg" length="0"/>` : ''}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-us</language>
    <managingEditor>noreply@techwithbaljeet.web.app (${AUTHOR})</managingEditor>
    <webMaster>noreply@techwithbaljeet.web.app (${AUTHOR})</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/og-default.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=31536000',
    },
  });
}
