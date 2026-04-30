'use client';
import { useEffect, useRef } from 'react';

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

interface PostContentProps {
  html: string;
  className?: string;
}

export function PostContent({ html, className }: PostContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const blocks = Array.from(container.querySelectorAll('pre'));
    const cleanup: (() => void)[] = [];

    blocks.forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return; // already injected

      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      btn.innerHTML = COPY_ICON;

      let resetTimer: ReturnType<typeof setTimeout>;

      const handleClick = async () => {
        const code = pre.querySelector('code');
        const text = (code?.innerText ?? pre.innerText).trimEnd();
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Fallback for non-https / older browsers
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.innerHTML = CHECK_ICON;
        btn.classList.add('copied');
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          btn.classList.remove('copied');
        }, 2000);
      };

      btn.addEventListener('click', handleClick);
      pre.appendChild(btn);

      cleanup.push(() => {
        clearTimeout(resetTimer);
        btn.removeEventListener('click', handleClick);
        btn.remove();
      });
    });

    return () => cleanup.forEach(fn => fn());
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
