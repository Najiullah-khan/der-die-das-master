import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { words } from "@/lib/db/schema";
import { resolveEmoji } from "@/lib/emoji/resolve";

export const revalidate = 3600; // ISR: word data changes rarely

async function getWord(slug: string) {
  const [word] = await db.select().from(words).where(eq(words.slug, slug)).limit(1);
  return word ?? null;
}

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
  const word = await getWord(slug);
  if (!word) return {};

  return {
    title: `${word.noun} – der, die or das? German Article & Meaning | Der-Die-Das Master`,
    description: `${word.article} ${word.noun} (${word.article === "der" ? "masculine" : word.article === "die" ? "feminine" : "neuter"}) means "${word.translation}". Plural: ${word.plural}. CEFR level ${word.cefrLevel}.`,
    alternates: { canonical: `/word/${word.slug}` },
  };
}

export default async function WordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const word = await getWord(slug);
  if (!word) notFound();

  const resolved = resolveEmoji(word.noun, word.article, word.emoji);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-4">
        {resolved.kind === "emoji" ? (
          <span className="text-6xl" aria-hidden>
            {resolved.glyph}
          </span>
        ) : (
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundColor: resolved.placeholderColor }}
            aria-hidden
          >
            {resolved.placeholderLetter}
          </span>
        )}
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

      {word.exampleDe && (
        <blockquote className="mt-8 border-l-4 border-neutral-300 pl-4 italic">
          <p>{word.exampleDe}</p>
          <p className="text-neutral-500">{word.exampleEn}</p>
        </blockquote>
      )}

      <a
        href={`/play/${word.cefrLevel}`}
        className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Practice this word
      </a>
    </main>
  );
}
