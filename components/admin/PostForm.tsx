'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TipTapEditor } from './TipTapEditor';
import { ImageUpload } from './ImageUpload';
import { triggerRevalidation, getPostRevalidationPayload } from '@/lib/revalidate';
import { adminCreatePost, adminUpdatePost, adminDeletePost } from '@/lib/admin-blog';
import type { Post } from '@/lib/types';
import { X, Save, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

interface PostFormProps {
  post?: Post;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '');
  const [tagInput, setTagInput] = useState(post?.tags.join(', ') ?? '');
  const [status, setStatus] = useState<'published' | 'draft'>(post?.status ?? 'draft');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const parseTags = (input: string) =>
    input.split(',').map(t => t.trim()).filter(Boolean);

  const handleSave = async (saveStatus: 'published' | 'draft') => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content.trim() || content === '<p></p>') { setError('Content is required.'); return; }

    setSaving(true);
    setError('');
    setSuccess('');

    const tags = parseTags(tagInput);
    const input = {
      title: title.trim(),
      content,
      excerpt: excerpt.trim(),
      tags,
      status: saveStatus,
      coverImage: coverImage || undefined,
    };

    try {
      let slug: string;
      if (isEditing && post) {
        await adminUpdatePost(post.id, input);
        // slug may change if title changed
        slug = title !== post.title
          ? title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
          : post.slug;
      } else {
        await adminCreatePost(input);
        slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
      }

      const payload = getPostRevalidationPayload(slug, tags);
      await triggerRevalidation(payload);

      setStatus(saveStatus);
      setSuccess(`Post ${saveStatus === 'published' ? 'published' : 'saved as draft'} successfully!`);

      if (!isEditing) {
        setTimeout(() => router.push('/admin/dashboard'), 1200);
      }
    } catch (err) {
      setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('Delete this post permanently?')) return;
    setDeleting(true);
    try {
      await adminDeletePost(post.id);
      const payload = getPostRevalidationPayload(post.slug, post.tags);
      await triggerRevalidation(payload);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDeleting(false);
    }
  };

  /** Called by TipTapEditor when user clicks the image button. */
  const handleEditorImageInsert = useCallback((insert: (url: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('@/lib/firebase');
        const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, '-')}`;
        const storageRef = ref(storage, `posts/inline/${filename}`);
        const task = uploadBytesResumable(storageRef, file);
        await new Promise<void>((resolve, reject) => {
          task.on('state_changed', null, reject, () => resolve());
        });
        const url = await getDownloadURL(task.snapshot.ref);
        insert(url);
      } catch (err) {
        console.error('Failed to upload inline image:', err);
      }
    };
    input.click();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">{isEditing ? 'Edit Post' : 'New Post'}</h1>
          <p className="text-sm text-zinc-500">
            {isEditing ? `Editing: ${post?.title}` : 'Create a new article'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400 hover:bg-red-950/50 disabled:opacity-50 transition-colors"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </button>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {saving && status === 'draft' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-900/30"
          >
            {saving && status === 'published' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Publish
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-900/50 bg-green-950/30 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Title *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Article title…"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg font-semibold text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Excerpt <span className="text-zinc-600">(shown in post cards)</span>
        </label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          placeholder="Brief description of the article…"
          rows={3}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-400">Cover Image</label>
        <div className="flex flex-wrap items-center gap-3">
          <ImageUpload
            onUpload={url => setCoverImage(url)}
            label="Upload Cover Image"
            folder="posts/covers"
          />
          <span className="text-xs text-zinc-600">or</span>
          <input
            value={coverImage}
            onChange={e => setCoverImage(e.target.value)}
            placeholder="Paste image URL…"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 min-w-[200px]"
          />
          {coverImage && (
            <button
              type="button"
              onClick={() => setCoverImage('')}
              className="text-zinc-500 hover:text-red-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {coverImage && (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Cover preview"
              className="h-40 w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
          Tags <span className="text-zinc-600">(comma-separated)</span>
        </label>
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          placeholder="kotlin, android, coroutines…"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500"
        />
        {tagInput && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parseTags(tagInput).map(tag => (
              <span key={tag} className="rounded-full bg-indigo-950/60 px-2.5 py-0.5 text-xs text-indigo-400">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Editor */}
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-400">Content *</label>
        <TipTapEditor
          content={content}
          onChange={setContent}
          onImageInsert={handleEditorImageInsert}
        />
      </div>

      {/* Bottom action bar */}
      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-3.5 w-3.5" /> Save Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave('published')}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          Publish
        </button>
      </div>
    </div>
  );
}
