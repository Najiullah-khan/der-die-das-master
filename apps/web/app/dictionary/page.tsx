import type { CodexEntry } from "@ddd/shared";
import { searchWords } from "@/lib/db/queries/words";
import { CodexBrowser } from "@/components/codex/CodexBrowser";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Dictionary – German Noun Dictionary & Vocabulary Tracker | Der-Die-Das Master",
  description: "Search the full German noun dictionary — article, plural, translation, and CEFR level for every word.",
  path: "/dictionary",
});

const PAGE_SIZE = 50;

/** `?page=N` (1-indexed) or `?offset=N` (raw row offset) — either is accepted, `offset` wins if
 * both are present. Invalid/missing values fall back to the first page. */
function resolveOffset(rawPage: string | undefined, rawOffset: string | undefined): number {
  if (rawOffset !== undefined) {
    const n = Number.parseInt(rawOffset, 10);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  if (rawPage !== undefined) {
    const n = Number.parseInt(rawPage, 10);
    if (Number.isInteger(n) && n >= 1) return (n - 1) * PAGE_SIZE;
  }
  return 0;
}

// Session-agnostic on purpose (blueprint §1: "ISR, personalized parts fetched client-side") —
// this shell renders the same unfiltered first page for every visitor so it stays cacheable;
// CodexBrowser fetches an authed refresh client-side when there's a session to personalize with.
// `?q=` (the WebSite SearchAction's target — lib/seo/structured-data.ts) and `?page=`/`?offset=`
// are the exceptions: they're read here so the initial SSR response — and its crawlable
// Previous/Next links (CodexBrowser) — already reflect the request instead of silently dropping
// it, then handed to CodexBrowser as the seed for its own client-side state.
export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; offset?: string }>;
}) {
  const { q, page, offset: rawOffset } = await searchParams;
  const offset = resolveOffset(page, rawOffset);
  const { rows, total } = await searchWords({ search: q, limit: PAGE_SIZE, offset });
  const initialEntries: CodexEntry[] = rows.map(({ word, stats }) => ({
    ...word,
    stats: stats ? { attempts: stats.attempts, correct: stats.correct, mastery: stats.mastery } : null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Dictionary</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">
        Browse and search the {total.toLocaleString()}-word noun dictionary.
      </p>

      <CodexBrowser
        initialEntries={initialEntries}
        initialTotal={total}
        limit={PAGE_SIZE}
        initialSearch={q ?? ""}
        initialOffset={offset}
      />
    </main>
  );
}
