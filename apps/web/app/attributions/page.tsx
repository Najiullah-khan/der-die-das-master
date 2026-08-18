import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data sources & attributions – Der-Die-Das Master",
  description: "The open datasets behind Der-Die-Das Master's noun dictionary and example sentences.",
  alternates: { canonical: "/attributions" },
};

export default function AttributionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">Data sources & attributions</h1>
      <p className="mt-4 text-neutral-600 dark:text-neutral-300">
        The noun dictionary powering this site is built from openly licensed data, credited below.
      </p>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">Wiktionary / Kaikki.org</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Nouns, articles, plural forms, and translations are derived from the German-language{" "}
          <a href="https://kaikki.org/dictionary/German/" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
            Kaikki.org Wiktionary extract
          </a>
          , which parses{" "}
          <a href="https://www.wiktionary.org/" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
            Wiktionary
          </a>
          . Licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            className="underline hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            CC BY-SA 3.0
          </a>
          .
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Tatoeba</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Some example sentences are sourced from{" "}
          <a href="https://tatoeba.org/" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
            Tatoeba.org
          </a>{" "}
          and its contributors, licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by/2.0/fr/"
            className="underline hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            CC BY 2.0 FR
          </a>
          . Sentences sourced this way are marked &quot;via Tatoeba.org&quot; on the word page they appear on.
        </p>
      </section>

      <p className="mt-10 text-xs text-neutral-500 dark:text-neutral-400">
        CEFR level tags are a best-effort frequency-based heuristic, not an official certification.
      </p>
    </main>
  );
}
