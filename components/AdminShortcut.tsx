'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

export function AdminShortcut() {
  const router = useRouter();
  const seq = useRef<string[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      seq.current = [...seq.current, e.key].slice(-KONAMI.length);
      if (seq.current.join() === KONAMI.join()) {
        router.push('/admin/login');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  return null;
}
