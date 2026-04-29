'use client';
import { useRef, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
  folder?: string;
}

export function ImageUpload({ onUpload, label = 'Upload Image', folder = 'posts' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }

    setUploading(true);
    setError('');
    setUploaded(false);

    const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, '-')}`;
    const storageRef = ref(storage, `${folder}/${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      snapshot => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      err => {
        setError(`Upload failed: ${err.message}`);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onUpload(url);
        setUploading(false);
        setUploaded(true);
        setProgress(0);
      }
    );
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-400 transition-all hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-60"
      >
        {uploading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading {progress}%…</>
        ) : uploaded ? (
          <><CheckCircle className="h-4 w-4 text-green-400" /> <span className="text-green-400">Uploaded!</span></>
        ) : (
          <><Upload className="h-4 w-4" /> {label}</>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
