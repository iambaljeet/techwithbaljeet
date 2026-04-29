import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(idToken);

    const adminEmail = process.env.ADMIN_EMAIL ?? 'baljeet.fb@gmail.com';
    if (decoded.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { paths?: string[]; tags?: string[] };

    for (const path of body.paths ?? []) {
      revalidatePath(path, 'page');
    }
    for (const tag of body.tags ?? []) {
      revalidateTag(tag, {});
    }

    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
