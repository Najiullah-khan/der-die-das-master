import Link from "next/link";
import type { Article } from "@ddd/shared";
import { buildMetadata } from "@/lib/seo/metadata";
import { GENDER_LABEL, SEMANTIC_CATEGORIES, SUFFIX_RULES } from "@/lib/seo/gender-rules";
import { SemanticCategoryList, SuffixRuleList } from "@/components/seo/RuleList";
import { getTopWordsByArticleAndLevel, getWordCountByArticle } from "@/lib/db/queries/words";
import { PLAYABLE_LEVELS } from "@/lib/game-engine/levels";
import { wordPath } from "@/lib/seo/word-url";

const ARTICLE_TEXT_CLASS: Record<Article, string> = { der: "text-der", die: "text-die", das: "text-das" };
// Full literal class strings, not template-built (`bg-${article}`) — Tailwind's compiler only
// picks up class names it can find verbatim in source.
const ARTICLE_CTA_CLASS: Record<Article, string> = {
  der: "bg-der hover:bg-der-strong",
  die: "bg-die hover:bg-die-strong",
  das: "bg-das hover:bg-das-strong",
};
const ARTICLE_INTRO: Record<Article, string> = {
  der: "Masculine is the largest article group in German — most people, agents (-er, -or, -ist), and calendar words (days, months, seasons) take der.",
  die: "Feminine has more genuinely exceptionless suffixes than either other gender — -ung, -heit, -keit, -schaft, -tät, and -ion nouns are reliably die.",
  das: "Neuter covers diminutives (-chen, -lein, which override any base word's own gender), several Latin/Greek loanword suffixes, and the metals and chemical elements.",
};

const WORDS_PER_LEVEL = 24;

export function generateArticleHubMetadata(article: Article) {
  return buildMetadata({
    title: `${article.charAt(0).toUpperCase()}${article.slice(1)} Words — German ${GENDER_LABEL[article].charAt(0).toUpperCase()}${GENDER_LABEL[article].slice(1)} Nouns by Level | Der-Die-Das Master`,
    description: `Suffix patterns, common exceptions, and the highest-frequency ${GENDER_LABEL[article]} German nouns (article: ${article}) for A1 through B2, with translations and links to practice.`,
    path: `/${article}`,
  });
}

export async function ArticleHubBody({ article }: { article: Article }) {
  const [totalCount, levelWords] = await Promise.all([
    getWordCountByArticle(article),
    Promise.all(PLAYABLE_LEVELS.map((level) => getTopWordsByArticleAndLevel(article, level, WORDS_PER_LEVEL))),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/der-die-das" className="hover:underline">
          Der, Die, Das Rules
        </Link>{" "}
        / <span className="text-neutral-700 dark:text-neutral-300">{article}</span>
      </nav>

      <h1 className={`text-4xl font-bold tracking-tight ${ARTICLE_TEXT_CLASS[article]}`}>
        {article} — German {GENDER_LABEL[article]} nouns
      </h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">{ARTICLE_INTRO[article]}</p>
      <p className="mt-2 text-sm text-neutral-500">{totalCount.toLocaleString()} {article} nouns in the dictionary.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/play/A1"
          className={`rounded-full px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 ${ARTICLE_CTA_CLASS[article]}`}
        >
          Practice with A1 nouns
        </Link>
        <Link
          href="/der-die-das"
          className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Read the full gender guide
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Suffix patterns</h2>
        <SuffixRuleList rules={SUFFIX_RULES[article]} />
      </section>

      {SEMANTIC_CATEGORIES[article].length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Semantic categories</h2>
          <SemanticCategoryList categories={SEMANTIC_CATEGORIES[article]} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">High-frequency {article} nouns by level</h2>
        {PLAYABLE_LEVELS.map((level, i) => {
          const words = levelWords[i];
          if (words.length === 0) return null;
          return (
            <div key={level} className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-500">{level}</h3>
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
    </main>
  );
}
