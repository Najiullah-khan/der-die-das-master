import { Repeat2, BookOpenCheck, Flame } from "lucide-react";
import { getWordCount, getDemoWord } from "@/lib/db/queries/words";
import { DemoCard } from "@/components/marketing/DemoCard";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildHomeStructuredData } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600; // ISR — landing page stays static/cacheable (blueprint §1/§9)

export async function generateMetadata() {
  const wordCount = await getWordCount();
  return buildMetadata({
    title: "Der-Die-Das Master — Learn German Noun Genders",
    description: `Learn German noun genders the fast way. Practice der, die, and das across ${wordCount.toLocaleString()} words — no account required.`,
    path: "/",
  });
}

export default async function Home() {
  const [wordCount, demoWord] = await Promise.all([getWordCount(), getDemoWord()]);
  const structuredData = buildHomeStructuredData(wordCount);

  const features = [
    {
      icon: Repeat2,
      title: "Smart repetition",
      description: "Words you miss come back sooner — \"No Word Left Behind\" keeps every session focused on what you actually need to practice.",
    },
    {
      icon: BookOpenCheck,
      title: `${wordCount.toLocaleString()} words`,
      description: "From A1 essentials to C2 vocabulary, every noun ships with its plural, a mnemonic, and a real example sentence.",
    },
    {
      icon: Flame,
      title: "Streaks that stick",
      description: "Daily and session streaks, perfect-batch bonuses, and a dictionary that tracks your mastery word by word.",
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd data={structuredData} />
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 py-20 text-center lg:flex-row lg:items-center lg:gap-16 lg:py-28 lg:text-left">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="text-der">Der</span>·<span className="text-die">Die</span>·
            <span className="text-das">Das</span> Master
          </h1>
          <p className="max-w-md text-lg text-neutral-600 dark:text-neutral-300">
            Learn German noun genders the fast way. Guess der, die, or das — no account required.
          </p>
          <a
            href="/play"
            className="animate-cta-glow rounded-full bg-der px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-der-strong"
          >
            Start Free Practice
          </a>
          <div className="flex gap-4 text-sm text-neutral-500">
            <a href="/dictionary" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">
              Browse the dictionary
            </a>
            <a href="/leaderboard" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">
              Leaderboard
            </a>
            <a href="/blog" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">
              Blog
            </a>
          </div>
        </div>

        {demoWord && (
          <div className="shrink-0">
            <DemoCard word={demoWord} />
          </div>
        )}
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-der/10 text-der dark:bg-der/20">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
