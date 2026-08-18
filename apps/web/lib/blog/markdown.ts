import { marked } from "marked";

marked.setOptions({ gfm: true });

/**
 * Renders post markdown to HTML. Content is admin-authored only (gated by `ADMIN_EMAIL`,
 * see lib/auth/admin.ts) — same trust boundary as direct DB access — so raw HTML passthrough
 * isn't sanitized further here.
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false });
}
