import Link from "next/link";
import type { Article, CefrLevel } from "@ddd/shared";
import { buildMetadata } from "@/lib/seo/metadata";
import { getTopWordsByArticleAndLevel, getWordCountByLevel } from "@/lib/db/queries/words";
import { wordPath } from "@/lib/seo/word-url";

// Only the levels with real seeded vocabulary get a public hub (blueprint's thin-content SEO
// risk note) — mirrors PLAYABLE_LEVELS (lib/game-engine/levels.ts) rather than importing it
// directly, since a level hub is meaningful independent of whether /play supports it yet.
export type PublicLevel = "A1" | "A2" | "B1" | "B2";

const LEVEL_DESCRIPTION: Record<PublicLevel, string> = {
  A1: "Absolute beginner. The everyday essentials — greetings, numbers, family, food, and the objects in a typical room — that every other level builds on.",
  A2: "Elementary. Vocabulary for routines, shopping, travel, and simple daily conversation beyond the absolute basics.",
  B1: "Intermediate. More abstract vocabulary — opinions, feelings, work, and current events — for independent, everyday communication.",
  B2: "Upper-intermediate. Nuanced, professional, and academic vocabulary for detailed, fluent discussion of complex topics.",
};

const ARTICLES: Article[] = ["der", "die", "das"];
const ARTICLE_TEXT_CLASS: Record<Article, string> = { der: "text-der", die: "text-die", das: "text-das" };
const WORDS_PER_ARTICLE = 20;

export function generateLevelHubMetadata(level: PublicLevel) {
  return buildMetadata({
    title: `${level} German Vocabulary — Nouns with Der, Die, Das | Der-Die-Das Master`,
    description: `${LEVEL_DESCRIPTION[level]} High-yield ${level} German nouns with their article, translation, and a direct link to practice.`,
    path: `/${level.toLowerCase()}`,
  });
}

export async function LevelHubBody({ level }: { level: PublicLevel }) {
  const cefrLevel = level as CefrLevel;
  const [totalCount, articleWords] = await Promise.all([
    getWordCountByLevel(cefrLevel),
    Promise.all(ARTICLES.map((article) => getTopWordsByArticleAndLevel(article, cefrLevel, WORDS_PER_ARTICLE))),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        / <span className="text-neutral-700 dark:text-neutral-300">{level}</span>
      </nav>

      <h1 className="text-4xl font-bold tracking-tight">{level} German Vocabulary</h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">{LEVEL_DESCRIPTION[level]}</p>
      <p className="mt-2 text-sm text-neutral-500">{totalCount.toLocaleString()} {level} nouns in the dictionary.</p>

      <Link
        href={`/play/${level}`}
        className="animate-cta-glow mt-6 inline-block rounded-full bg-der px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-der-strong"
      >
        Practice {level} nouns
      </Link>

      <section className="mt-10">
        <h2 className="text-xl font-bold">High-yield {level} nouns</h2>
        {ARTICLES.map((article, i) => {
          const words = articleWords[i];
          if (words.length === 0) return null;
          return (
            <div key={article} className="mt-6">
              <h3 className={`text-sm font-semibold ${ARTICLE_TEXT_CLASS[article]}`}>
                <Link href={`/${article}`} className="hover:underline">
                  {article}
                </Link>
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {words.map((word) => (
                  <li key={word.slug}>
                    <Link
                      href={wordPath(word)}
                      className="inline-block rounded-full border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                    >
                      {word.article} {word.noun} <span className="text-neutral-500">— {word.translation}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <div className="mt-12 rounded-2xl border border-neutral-200 p-6 text-center dark:border-neutral-800">
        <p className="font-semibold">Ready to make {level} vocabulary stick?</p>
        <Link
          href={`/play/${level}`}
          className="mt-4 inline-block rounded-full bg-der px-6 py-3 font-semibold text-white hover:bg-der-strong"
        >
          Practice {level} nouns
        </Link>
      </div>
    </main>
  );
}
