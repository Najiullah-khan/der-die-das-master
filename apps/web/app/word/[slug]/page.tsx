import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { words } from "@/lib/db/schema";
import { getWordBySlug, getRelatedWords } from "@/lib/db/queries/words";
import { WordEmoji } from "@/components/word/WordEmoji";
import { getGenderMnemonic } from "@/lib/seo/mnemonics";
import { describePluralPattern } from "@/lib/seo/plural-pattern";
import { buildWordStructuredData } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600; // ISR: word data changes rarely

const GENDER_LABEL = { der: "masculine", die: "feminine", das: "neuter" } as const;

export async function generateStaticParams() {
  const rows = await db.select({ slug: words.slug }).from(words);
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const word = await getWordBySlug(slug);
  if (!word) return {};

  return {
    title: `${word.noun} – der, die or das? German Article & Meaning | Der-Die-Das Master`,
    description: `${word.article} ${word.noun} (${GENDER_LABEL[word.article]}) means "${word.translation}". Plural: ${word.plural}. CEFR level ${word.cefrLevel}.`,
    alternates: { canonical: `/word/${word.slug}` },
  };
}

export default async function WordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const word = await getWordBySlug(slug);
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
      </div>

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
                  href={`/word/${related.slug}`}
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
