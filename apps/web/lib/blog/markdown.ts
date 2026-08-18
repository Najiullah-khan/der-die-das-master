import { marked } from "marked";

marked.setOptions({ gfm: true });

/**
 * Renders post markdown to HTML. Content is admin-authored only (gated by `ADMIN_EMAIL`,
 * see lib/auth/admin.ts) — same trust boundary as direct DB access — so raw HTML passthrough
 * isn't sanitized further here.
 *
 * Blockquotes whose first line starts with 💡 or ⚠️ get a distinguishing class so they render
 * as "Key Takeaway" / "Exception" callout cards instead of a plain quote (styled in
 * app/blog/[slug]/page.tsx's markdown wrapper) — a lightweight convention, not a new syntax:
 * authors just start a `>` blockquote with that emoji, which several posts already did
 * organically before this styling existed.
 */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return html
    .replace(/<blockquote>\s*<p>💡/g, '<blockquote class="callout-tip"><p>💡')
    .replace(/<blockquote>\s*<p>⚠️/g, '<blockquote class="callout-warning"><p>⚠️');
}
