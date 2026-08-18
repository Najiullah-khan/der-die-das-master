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

// Session-agnostic on purpose (blueprint §1: "ISR, personalized parts fetched client-side") —
// this shell renders the same unfiltered first page for every visitor so it stays cacheable;
// CodexBrowser fetches an authed refresh client-side when there's a session to personalize with.
export default async function DictionaryPage() {
  const { rows, total } = await searchWords({ limit: PAGE_SIZE, offset: 0 });
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

      <CodexBrowser initialEntries={initialEntries} initialTotal={total} limit={PAGE_SIZE} />
    </main>
  );
}
