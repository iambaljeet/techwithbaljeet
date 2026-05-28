import { NextRequest, NextResponse } from 'next/server';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * POST /api/import-doc
 * Accepts a multipart form upload with field "file".
 * Supported types: .docx, .doc, .md, .pdf
 * Returns: { html: string, title: string | null, warnings: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 413 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const buffer = Buffer.from(await file.arrayBuffer());
    const warnings: string[] = [];

    // ── DOCX / DOC ────────────────────────────────────────────────────────────
    if (ext === 'docx' || ext === 'doc') {
      const mammoth = await import('mammoth');

      const result = await mammoth.convertToHtml(
        { buffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            const base64 = await image.read('base64');
            return { src: `data:${image.contentType};base64,${base64}` };
          }),
          styleMap: [
            // Map common Word heading styles
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            // Map common Word code styles
            "p[style-name='Code'] => pre:fresh",
            "p[style-name='Code Block'] => pre:fresh",
            "p[style-name='Preformatted Text'] => pre:fresh",
            "r[style-name='Code'] => code",
            "r[style-name='Verbatim Char'] => code",
            // Captions
            "p[style-name='Caption'] => figcaption:fresh",
            // Quote
            "p[style-name='Quote'] => blockquote > p:fresh",
            "p[style-name='Intense Quote'] => blockquote > p:fresh",
          ],
        },
      );

      for (const msg of result.messages) {
        if (msg.type === 'warning') warnings.push(msg.message);
      }

      const title = extractTitle(result.value);
      return NextResponse.json({ html: result.value, title, warnings });
    }

    // ── MARKDOWN ──────────────────────────────────────────────────────────────
    if (ext === 'md' || ext === 'markdown') {
      const { marked } = await import('marked');
      // GFM is enabled by default in marked v9+
      const html = await marked.parse(buffer.toString('utf-8'), { gfm: true });
      const title = extractTitle(html);
      return NextResponse.json({ html, title, warnings });
    }

    // ── PDF ───────────────────────────────────────────────────────────────────
    if (ext === 'pdf') {
      // pdf-parse is CJS; dynamic import returns the module object directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import('pdf-parse') as any;
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const data = await pdfParse(buffer);
      const html = pdfTextToHtml(data.text);
      warnings.push('PDF import extracts text only — images, tables, and complex formatting may not be fully preserved.');
      const title = extractTitle(html);
      return NextResponse.json({ html, title, warnings });
    }

    return NextResponse.json(
      { error: `Unsupported file type: .${ext}. Supported: .docx, .doc, .md, .pdf` },
      { status: 400 },
    );
  } catch (err) {
    console.error('[import-doc]', err);
    return NextResponse.json(
      { error: 'Failed to process file. Make sure it is a valid document.' },
      { status: 500 },
    );
  }
}

/** Pull the first heading text from HTML to use as suggested title */
function extractTitle(html: string): string | null {
  const m = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').trim() || null;
}

/**
 * Convert raw PDF text (line-based) to basic HTML.
 * Tries to detect headings, lists, code blocks, and paragraphs.
 */
function pdfTextToHtml(text: string): string {
  const lines = text.split('\n');
  const html: string[] = [];
  let paraLines: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  const flush = () => {
    if (paraLines.length) {
      html.push(`<p>${escape(paraLines.join(' '))}</p>`);
      paraLines = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Blank line → paragraph break
    if (!trimmed) {
      if (inCode) {
        codeLines.push('');
      } else {
        flush();
      }
      continue;
    }

    // Detect code-like blocks: lines where majority start with spaces/tabs
    const isIndented = /^(\t| {3,})/.test(line);
    if (isIndented && !inCode) {
      flush();
      inCode = true;
      codeLines = [];
    }
    if (!isIndented && inCode && trimmed) {
      html.push(`<pre><code>${escape(codeLines.join('\n'))}</code></pre>`);
      codeLines = [];
      inCode = false;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // Detect headings: short lines (≤80 chars), no punctuation at end except : 
    const couldBeHeading =
      trimmed.length > 0 &&
      trimmed.length <= 80 &&
      !/[.,;!?]$/.test(trimmed) &&
      !/^\d+\./.test(trimmed); // not a numbered list item

    if (couldBeHeading && paraLines.length === 0 && /^[A-Z]/.test(trimmed)) {
      flush();
      html.push(`<h2>${escape(trimmed)}</h2>`);
      continue;
    }

    // Detect bullet lists: lines starting with -, •, *, ·
    const bulletMatch = trimmed.match(/^[-•*·]\s+(.+)/);
    if (bulletMatch) {
      flush();
      // peek ahead handled simply — wrap single items
      html.push(`<ul><li>${escape(bulletMatch[1])}</li></ul>`);
      continue;
    }

    // Detect numbered lists: lines starting with 1. 2. etc
    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numberedMatch) {
      flush();
      html.push(`<ol><li>${escape(numberedMatch[1])}</li></ol>`);
      continue;
    }

    paraLines.push(trimmed);
  }

  if (inCode && codeLines.length) {
    html.push(`<pre><code>${escape(codeLines.join('\n'))}</code></pre>`);
  }
  flush();

  // Merge adjacent ul/ol tags for cleaner output
  return html.join('\n')
    .replace(/<\/ul>\n<ul>/g, '')
    .replace(/<\/ol>\n<ol>/g, '');
}

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
