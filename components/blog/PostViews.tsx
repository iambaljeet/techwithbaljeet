'use client';
import { useEffect, useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Eye } from 'lucide-react';

export function PostViews({ postId, slug, initialViews }: { postId: string; slug: string; initialViews: number }) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    const key = `viewed-${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const postRef = doc(db, 'posts', postId);
    updateDoc(postRef, { views: increment(1) }).then(() => {
      setViews(v => v + 1);
    }).catch(() => {});
  }, [postId, slug]);

  return (
    <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
      <Eye className="h-3.5 w-3.5" />
      <span>{views.toLocaleString()} views</span>
    </div>
  );
}
