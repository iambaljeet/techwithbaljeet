'use client';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Post } from './types';

const PAGE_SIZE = 10;

function docToPost(doc: QueryDocumentSnapshot | DocumentSnapshot): Post {
  const data = doc.data()!;
  const toDate = (ts: unknown) => ts instanceof Timestamp ? ts.toDate().toISOString() : null;
  return {
    id: doc.id,
    title: data.title ?? '',
    slug: data.slug ?? doc.id,
    excerpt: data.excerpt ?? '',
    content: data.content ?? '',
    coverImage: data.coverImage,
    tags: data.tags ?? [],
    author: data.author ?? 'Baljeet Singh',
    publishedAt: toDate(data.publishedAt),
    updatedAt: toDate(data.updatedAt),
    status: data.status ?? 'draft',
    wordCount: data.wordCount ?? 0,
    readTime: data.readTime ?? 1,
  };
}

export async function adminGetPosts(
  pageSize = PAGE_SIZE,
  lastDoc?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  let q = query(
    collection(db, 'posts'),
    orderBy('publishedAt', 'desc'),
    limit(pageSize + 1)
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snapshot = await getDocs(q);
  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
  return {
    posts: docs.map(docToPost),
    lastDoc: docs[docs.length - 1] ?? null,
    hasMore,
  };
}

export async function adminGetPostById(id: string): Promise<Post | null> {
  const docRef = doc(db, 'posts', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return docToPost(snap);
}

export async function adminSearchPosts(searchQuery: string): Promise<Post[]> {
  // Client-side search across title and tags (Firestore doesn't support full-text)
  const snapshot = await getDocs(
    query(collection(db, 'posts'), orderBy('publishedAt', 'desc'))
  );
  const q = searchQuery.toLowerCase();
  return snapshot.docs
    .map(docToPost)
    .filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function countWords(html: string): number {
  return html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export interface PostInput {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: 'published' | 'draft';
  coverImage?: string;
  publishedAt?: string | null;
}

export async function adminCreatePost(input: PostInput): Promise<string> {
  const wordCount = countWords(input.content);
  const slug = slugify(input.title);
  const docRef = await addDoc(collection(db, 'posts'), {
    title: input.title,
    slug,
    content: input.content,
    excerpt: input.excerpt,
    tags: input.tags,
    status: input.status,
    coverImage: input.coverImage ?? null,
    author: 'Baljeet Singh',
    publishedAt: input.status === 'published' ? (input.publishedAt ?? serverTimestamp()) : null,
    updatedAt: serverTimestamp(),
    wordCount,
    readTime: estimateReadTime(wordCount),
  });
  // Update tags collection
  await updateTagCounts(input.tags, 1);
  return docRef.id;
}

export async function adminUpdatePost(id: string, input: Partial<PostInput>): Promise<void> {
  const docRef = doc(db, 'posts', id);
  const existing = await getDoc(docRef);
  const existingData = existing.data();
  const wordCount = input.content ? countWords(input.content) : undefined;
  const updateData: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };
  if (wordCount !== undefined) {
    updateData.wordCount = wordCount;
    updateData.readTime = estimateReadTime(wordCount);
  }
  if (input.status === 'published' && existingData?.status !== 'published') {
    updateData.publishedAt = input.publishedAt ?? serverTimestamp();
  }
  if (input.title && input.title !== existingData?.title) {
    updateData.slug = slugify(input.title);
  }
  await updateDoc(docRef, updateData);
  // Update tag counts if tags changed
  if (input.tags && existingData?.tags) {
    const oldTags: string[] = existingData.tags;
    const newTags = input.tags;
    const removed = oldTags.filter(t => !newTags.includes(t));
    const added = newTags.filter(t => !oldTags.includes(t));
    if (removed.length) await updateTagCounts(removed, -1);
    if (added.length) await updateTagCounts(added, 1);
  }
}

export async function adminDeletePost(id: string): Promise<void> {
  const docRef = doc(db, 'posts', id);
  const snap = await getDoc(docRef);
  const tags: string[] = snap.data()?.tags ?? [];
  await deleteDoc(docRef);
  if (tags.length) await updateTagCounts(tags, -1);
}

async function updateTagCounts(tags: string[], delta: number): Promise<void> {
  for (const tag of tags) {
    const slug = tag.toLowerCase().replace(/\s+/g, '-');
    const tagRef = doc(db, 'tags', slug);
    const snap = await getDoc(tagRef);
    if (snap.exists()) {
      const newCount = Math.max(0, (snap.data().count ?? 0) + delta);
      await updateDoc(tagRef, { count: newCount });
    } else if (delta > 0) {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(tagRef, { name: tag, slug, count: 1 });
    }
  }
}
