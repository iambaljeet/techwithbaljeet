import * as cheerio from 'cheerio';

/**
 * Server-only: parses and sanitizes post HTML content.
 *
 * Medium-exported posts are full HTML documents with nested section/div
 * wrappers, a <h3 class="graf--title"> title element, and a leading
 * <figure class="graf--figure"> cover image — all of which the post page
 * already renders separately. This extracts only the real article body.
 *
 * Admin-written (TipTap) posts are clean HTML fragments and are returned
 * unchanged (no wrappers, no duplicate title/image present).
 */
export function sanitizeContent(html: string): string {
  if (!html) return '';

  const isMediumHtml =
    html.trimStart().startsWith('<html') ||
    html.includes('section--body') ||
    html.includes('graf--title');

  if (!isMediumHtml) {
    // Clean TipTap HTML — return as-is
    return html.trim();
  }

  const $ = cheerio.load(html);

  // 1. Remove the title element (Medium uses h3/h4 with class graf--title)
  $('[class*="graf--title"]').first().remove();

  // 2. Remove the very first figure (the featured/cover image)
  $('figure').first().remove();

  // 3. Remove section dividers (purely decorative <hr> wrappers)
  $('.section-divider').remove();

  // 4. Extract content from all .section-inner divs (Medium splits long
  //    articles into multiple <section> elements)
  const parts: string[] = [];
  $('.section-inner').each((_, el) => {
    const inner = $(el).html();
    if (inner?.trim()) parts.push(inner.trim());
  });

  if (parts.length > 0) {
    return parts.join('\n');
  }

  // Fallback: return body innerHTML if no section-inner found
  return $('body').html()?.trim() ?? html.trim();
}
