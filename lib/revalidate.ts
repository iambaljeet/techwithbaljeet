import { getAuth } from 'firebase/auth';

export async function triggerRevalidation({
  paths = [],
  tags = [],
}: {
  paths?: string[];
  tags?: string[];
}): Promise<void> {
  try {
    const user = getAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paths, tags }),
    });
  } catch (err) {
    console.error('Failed to trigger revalidation:', err);
    // Non-fatal: page will auto-revalidate after 1 year
  }
}

export function getPostRevalidationPayload(slug: string, tags: string[]) {
  return {
    paths: ['/', `/post/${slug}`, ...tags.map(t => `/tag/${t.toLowerCase().replace(/\s+/g, '-')}`)],
    tags: ['posts', `post-${slug}`, ...tags.map(t => `tag-${t.toLowerCase().replace(/\s+/g, '-')}`)],
  };
}
