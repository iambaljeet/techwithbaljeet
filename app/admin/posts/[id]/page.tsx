'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminGetPostById } from '@/lib/admin-blog';
import { PostForm } from '@/components/admin/PostForm';
import type { Post } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    adminGetPostById(id)
      .then(p => {
        if (!p) setError('Post not found.');
        else setPost(p);
      })
      .catch(() => setError('Failed to load post.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (!post) return null;

  return <PostForm post={post} />;
}
