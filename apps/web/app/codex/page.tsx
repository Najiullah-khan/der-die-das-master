import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { words } from "@/lib/db/schema";
import { resolveEmoji } from "@/lib/emoji/resolve";

export const revalidate = 3600;
export const metadata = { title: "Codex – Der-Die-Das Master" };

const PAGE_SIZE = 50;

export default async function CodexPage() {
  // Basic paginated listing for now; search/level/mastery filters are Phase 3 (blueprint §8/§11).
  const rows = await db.select().from(words).orderBy(asc(words.frequencyRank)).limit(PAGE_SIZE);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Codex</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">
        Browse the noun dictionary. Showing the {rows.length} most common words.
      </p>

      <ul className="mt-8 divide-y divide-neutral-200 dark:divide-neutral-800">
        {rows.map((word) => {
          const resolved = resolveEmoji(word.noun, word.article, word.emoji);
          return (
            <li key={word.slug}>
              <a
                href={`/word/${word.slug}`}
                className="flex items-center gap-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <span className="w-8 text-center text-2xl" aria-hidden>
                  {resolved.kind === "emoji" ? resolved.glyph : "🔤"}
                </span>
                <span className="flex-1">
                  <span className="font-medium">
                    {word.article} {word.noun}
                  </span>
                  <span className="ml-2 text-neutral-500">{word.translation}</span>
                </span>
                <span className="text-xs text-neutral-400">{word.cefrLevel}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
