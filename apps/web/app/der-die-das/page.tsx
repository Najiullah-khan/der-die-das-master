import type { Article } from "@ddd/shared";
import { buildMetadata } from "@/lib/seo/metadata";
import { SUFFIX_RULES, SEMANTIC_CATEGORIES, GENDER_LABEL } from "@/lib/seo/gender-rules";
import { SuffixRuleList, SemanticCategoryList } from "@/components/seo/RuleList";

export const metadata = buildMetadata({
  title: "Der, Die, Das — The Complete Guide to German Noun Gender | Der-Die-Das Master",
  description:
    "Every reliable suffix pattern, common tendency, and semantic category for predicting German noun gender — with the real exceptions called out, not glossed over.",
  path: "/der-die-das",
});

const ARTICLES: Article[] = ["der", "die", "das"];

const ARTICLE_TEXT_CLASS: Record<Article, string> = { der: "text-der", die: "text-die", das: "text-das" };
const ARTICLE_HUB_BLURB: Record<Article, string> = {
  der: "Masculine nouns — people, agents, and the calendar (days, months, seasons).",
  die: "Feminine nouns — the largest group by suffix count, and most of the truly exceptionless ones.",
  das: "Neuter nouns — diminutives, loanword suffixes, and the elements.",
};

export default function DerDieDasGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <a href="/" className="hover:underline">
          Home
        </a>{" "}
        / <span className="text-neutral-700 dark:text-neutral-300">Der, Die, Das Rules</span>
      </nav>

      <h1 className="text-4xl font-bold tracking-tight">
        <span className="text-der">Der</span>, <span className="text-die">Die</span>, <span className="text-das">Das</span> — The
        Complete Guide to German Noun Gender
      </h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        German assigns every noun a grammatical gender — masculine (<em>der</em>), feminine (<em>die</em>), or neuter (<em>das</em>) —
        and while there's no single rule that covers all of it, suffixes and word meaning predict gender correctly far more often
        than most learners expect. This guide separates the patterns that are genuinely reliable from the ones that are just
        common tendencies, and names the real exceptions to each.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/play/A1"
          className="animate-cta-glow rounded-full bg-der px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-der-strong"
        >
          Practice with A1 nouns
        </a>
        <a
          href="/dictionary"
          className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Browse the dictionary
        </a>
      </div>

      <div className="mt-10 rounded-2xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <p className="font-semibold">How to read this guide</p>
        <p className="mt-1 text-neutral-600 dark:text-neutral-300">
          Every pattern below is labeled <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Reliable pattern</span> when
          it has no known counterexamples in standard German, or <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Tendency, not a rule</span> when
          it's a strong lean with real, commonly-cited exceptions — which are named, not hidden.
        </p>
      </div>

      {ARTICLES.map((article) => (
        <section key={article} className="mt-12">
          <h2 className={`text-2xl font-bold ${ARTICLE_TEXT_CLASS[article]}`}>
            {article} — {GENDER_LABEL[article]} nouns
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{ARTICLE_HUB_BLURB[article]}</p>

          <h3 className="mt-6 text-lg font-semibold">Suffix patterns</h3>
          <SuffixRuleList rules={SUFFIX_RULES[article]} />

          {SEMANTIC_CATEGORIES[article].length > 0 && (
            <>
              <h3 className="mt-6 text-lg font-semibold">Semantic categories</h3>
              <SemanticCategoryList categories={SEMANTIC_CATEGORIES[article]} />
            </>
          )}

          <a href={`/${article}`} className={`mt-4 inline-block text-sm font-medium underline ${ARTICLE_TEXT_CLASS[article]}`}>
            See all {GENDER_LABEL[article]} words by CEFR level →
          </a>
        </section>
      ))}

      <div className="mt-12 rounded-2xl border border-neutral-200 p-6 text-center dark:border-neutral-800">
        <p className="font-semibold">The fastest way to make these patterns stick is repetition, not memorization.</p>
        <a
          href="/play/A1"
          className="mt-4 inline-block rounded-full bg-der px-6 py-3 font-semibold text-white hover:bg-der-strong"
        >
          Start practicing der, die, das
        </a>
      </div>
    </main>
  );
}
