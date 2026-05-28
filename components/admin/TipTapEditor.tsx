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
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table';
import { TableHeader } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table';
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
  Table as TableIcon, Plus, Trash2, Columns2, Rows3, FileUp, Loader2, X, AlertTriangle,
} from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';

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
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'typescript' }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing your article…' }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      attributes: { class: 'tiptap-editor outline-none min-h-[400px] prose max-w-none' },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  // Close table menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
        setTableMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    // Reset so same file can be re-imported
    e.target.value = '';
    setImporting(true);
    setImportWarnings([]);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/import-doc', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Import failed');
      const hasContent = editor.getText().trim().length > 0;
      if (hasContent && !window.confirm('Replace current content with imported file?')) {
        setImporting(false);
        return;
      }
      editor.commands.setContent(json.html);
      onChange(editor.getHTML());
      if (json.warnings?.length) setImportWarnings(json.warnings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setImportWarnings([`Import error: ${msg}`]);
    } finally {
      setImporting(false);
    }
  }, [editor, onChange]);

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick, active, title, children, disabled,
  }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={`rounded p-1.5 text-sm transition-colors hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-indigo-900/50 text-indigo-400' : 'text-zinc-400'
      }`}
    >
      {children}
    </button>
  );

  const isInTable = editor.isActive('table');

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
        <div className="mx-1 w-px bg-zinc-700" />

        {/* Table */}
        <div className="relative" ref={tableMenuRef}>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setTableMenuOpen(o => !o); }}
            title="Table"
            className={`rounded p-1.5 text-sm transition-colors hover:bg-zinc-700 ${
              isInTable ? 'bg-indigo-900/50 text-indigo-400' : 'text-zinc-400'
            }`}
          >
            <TableIcon className="h-4 w-4" />
          </button>

          {tableMenuOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
              {/* Insert */}
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Insert</div>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  setTableMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                <TableIcon className="h-3.5 w-3.5 text-indigo-400" /> Insert table (3×3)
              </button>

              {isInTable && (
                <>
                  <div className="my-1 border-t border-zinc-700" />
                  <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Columns</div>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Columns2 className="h-3.5 w-3.5 text-indigo-400" /> Add column before
                  </button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Columns2 className="h-3.5 w-3.5 text-indigo-400" /> Add column after
                  </button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" /> Delete column
                  </button>

                  <div className="my-1 border-t border-zinc-700" />
                  <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Rows</div>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Rows3 className="h-3.5 w-3.5 text-indigo-400" /> Add row before
                  </button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Rows3 className="h-3.5 w-3.5 text-indigo-400" /> Add row after
                  </button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteRow().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" /> Delete row
                  </button>

                  <div className="my-1 border-t border-zinc-700" />
                  <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Cells</div>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().mergeCells().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Plus className="h-3.5 w-3.5 text-indigo-400" /> Merge cells
                  </button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().splitCell().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Minus className="h-3.5 w-3.5 text-indigo-400" /> Split cell
                  </button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeaderRow().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Rows3 className="h-3.5 w-3.5 text-indigo-400" /> Toggle header row
                  </button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeaderColumn().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
                    <Columns2 className="h-3.5 w-3.5 text-indigo-400" /> Toggle header col
                  </button>

                  <div className="my-1 border-t border-zinc-700" />
                  <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteTable().run(); setTableMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700">
                    <Trash2 className="h-3.5 w-3.5" /> Delete table
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {/* Import file */}
        <div className="mx-1 w-px bg-zinc-700" />
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); importFileRef.current?.click(); }}
          title="Import file (.docx, .doc, .md, .pdf)"
          disabled={importing}
          className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-indigo-400 disabled:opacity-40"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {importing ? 'Importing…' : 'Import'}
        </button>
        <input
          ref={importFileRef}
          type="file"
          accept=".docx,.doc,.md,.markdown,.pdf"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {/* Import warnings */}
      {importWarnings.length > 0 && (
        <div className="flex items-start gap-2 border-b border-amber-800/50 bg-amber-950/40 px-4 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1 text-xs text-amber-300">
            {importWarnings.map((w, i) => <p key={i}>{w}</p>)}
          </div>
          <button onClick={() => setImportWarnings([])} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="p-4 text-zinc-100">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
