import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Article } from "@ddd/shared";
import { getWordBySlug, getRelatedWords, getWordSlugsByArticle } from "@/lib/db/queries/words";
import { WordEmoji } from "@/components/word/WordEmoji";
import { getGenderMnemonic } from "@/lib/seo/mnemonics";
import { describePluralPattern } from "@/lib/seo/plural-pattern";
import { buildWordStructuredData } from "@/lib/seo/structured-data";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site-url";
import { wordPath } from "@/lib/seo/word-url";
import { GENDER_LABEL } from "@/lib/seo/gender-rules";
import { JsonLd } from "@/components/seo/JsonLd";
import { PronounceButton } from "@/components/word/PronounceButton";
import { WordQuizWidget } from "@/components/word/WordQuizWidget";

/** Shared `generateStaticParams` body for `app/der/[noun]`, `app/die/[noun]`, `app/das/[noun]`. */
export async function generateWordStaticParams(article: Article) {
  const rows = await getWordSlugsByArticle(article);
  return rows.map((r) => ({ noun: r.slug.slice(article.length + 1) }));
}

/** Shared `generateMetadata` body for `app/der/[noun]`, `app/die/[noun]`, `app/das/[noun]`. */
export async function generateWordMetadata(article: Article, noun: string): Promise<Metadata> {
  const word = await getWordBySlug(`${article}-${noun}`);
  if (!word) return {};

  const base = buildMetadata({
    title: `${word.noun} – der, die or das? German Article & Meaning | Der-Die-Das Master`,
    description: `${word.article} ${word.noun} (${GENDER_LABEL[word.article]}) means "${word.translation}". Plural: ${word.plural}. CEFR level ${word.cefrLevel}.`,
    path: wordPath(word),
  });

  // Per-word OG image (this route's own opengraph-image.tsx) instead of buildMetadata's root
  // fallback — see lib/seo/metadata.ts's doc comment on why every other page uses the default.
  const image = { url: `${getSiteUrl()}${wordPath(word)}/opengraph-image`, width: 1200, height: 630 };

  return {
    ...base,
    openGraph: { ...base.openGraph, images: [image] },
    twitter: { ...base.twitter, images: [image.url] },
  };
}

/** Shared page body for `app/der/[noun]`, `app/die/[noun]`, `app/das/[noun]`. */
export async function WordPageBody({ article, noun }: { article: Article; noun: string }) {
  const word = await getWordBySlug(`${article}-${noun}`);
  if (!word) notFound();

  const relatedWords = await getRelatedWords(word);
  const structuredData = buildWordStructuredData(word);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <JsonLd data={structuredData} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <a href="/" className="hover:underline">
          Home
        </a>{" "}
        /{" "}
        <a href={`/${word.article}`} className="hover:underline">
          {word.article}
        </a>{" "}
        /{" "}
        <a href={`/dictionary?level=${word.cefrLevel}`} className="hover:underline">
          {word.cefrLevel}
        </a>{" "}
        / <span className="text-neutral-700 dark:text-neutral-300">{word.article} {word.noun}</span>
      </nav>

      <div className="flex items-center gap-4">
        <WordEmoji word={word} size={64} />
        <h1 className="text-4xl font-bold">
          {word.article} {word.noun}
        </h1>
        <PronounceButton article={word.article} noun={word.noun} />
      </div>

      <WordQuizWidget article={word.article} noun={word.noun} />

      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">{word.translation}</p>

      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-neutral-500">Plural</dt>
          <dd className="font-medium">die {word.plural}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">CEFR level</dt>
          <dd className="font-medium">{word.cefrLevel}</dd>
        </div>
        {word.pronunciation && (
          <div>
            <dt className="text-neutral-500">Pronunciation</dt>
            <dd className="font-medium">{word.pronunciation}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 space-y-3 rounded-2xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <p>💡 {getGenderMnemonic(word.article, word.noun)}</p>
        <p>🔤 {describePluralPattern(word.noun, word.plural)}</p>
      </div>

      {word.exampleDe && (
        <blockquote className="mt-8 border-l-4 border-neutral-300 pl-4 italic">
          <p>{word.exampleDe}</p>
          <p className="text-neutral-500">{word.exampleEn}</p>
          {word.exampleSource === "tatoeba" && (
            <cite className="mt-1 block text-xs not-italic text-neutral-500 dark:text-neutral-400">via Tatoeba.org, CC BY 2.0 FR</cite>
          )}
        </blockquote>
      )}

      <a
        href={`/play/${word.cefrLevel}`}
        className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Practice this word
      </a>

      {relatedWords.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold">More {word.article} words</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {relatedWords.map((related) => (
              <li key={related.slug}>
                <a
                  href={wordPath(related)}
                  className="inline-block rounded-full border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  {related.article} {related.noun}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
