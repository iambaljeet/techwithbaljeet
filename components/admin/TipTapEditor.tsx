'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import kotlin from 'highlight.js/lib/languages/kotlin';
import java from 'highlight.js/lib/languages/java';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, CodeSquare,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Image as ImageIcon,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Highlighter, Undo, Redo, Minus,
} from 'lucide-react';
import { useCallback } from 'react';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('kotlin', kotlin);
lowlight.register('java', java);
lowlight.register('xml', xml);
lowlight.register('bash', bash);
lowlight.register('css', css);

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  /** Called when user clicks the image toolbar button.
   *  Receives an `insert(url)` callback — call it with the final image URL. */
  onImageInsert?: (insert: (url: string) => void) => void;
}

export function TipTapEditor({ content, onChange, onImageInsert }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'typescript' }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing your article…' }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editorProps: {
      attributes: { class: 'tiptap-editor outline-none min-h-[400px] prose max-w-none' },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (onImageInsert) {
      onImageInsert((url: string) => {
        editor?.chain().focus().setImage({ src: url }).run();
      });
    } else {
      const url = window.prompt('Enter image URL:');
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, onImageInsert]);

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick, active, title, children,
  }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`rounded p-1.5 text-sm transition-colors hover:bg-zinc-700 ${
        active ? 'bg-indigo-900/50 text-indigo-400' : 'text-zinc-400'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-zinc-700 bg-zinc-800/50 p-2">
        {/* History */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-4 w-4" /></ToolbarBtn>
        <div className="mx-1 w-px bg-zinc-700" />

        {/* Headings */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3"><Heading3 className="h-4 w-4" /></ToolbarBtn>
        <div className="mx-1 w-px bg-zinc-700" />

        {/* Formatting */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter className="h-4 w-4" /></ToolbarBtn>
        <div className="mx-1 w-px bg-zinc-700" />

        {/* Code */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code"><Code className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><CodeSquare className="h-4 w-4" /></ToolbarBtn>
        <div className="mx-1 w-px bg-zinc-700" />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></ToolbarBtn>
        <div className="mx-1 w-px bg-zinc-700" />

        {/* Alignment */}
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight className="h-4 w-4" /></ToolbarBtn>
        <div className="mx-1 w-px bg-zinc-700" />

        {/* Media */}
        <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="Add Link"><LinkIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={addImage} title="Insert Image"><ImageIcon className="h-4 w-4" /></ToolbarBtn>
      </div>

      {/* Editor area */}
      <div className="p-4 text-zinc-100">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
