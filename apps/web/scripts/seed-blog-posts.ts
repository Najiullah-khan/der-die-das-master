import { asc, eq } from "drizzle-orm";
import { db } from "../lib/db/client";
import { posts, words } from "../lib/db/schema";

/**
 * Every internal link below points at a noun page confirmed to exist in the seeded dataset
 * (checked against `words.noun` before writing this script) or a hub route that's always
 * present (/der-die-das, /der, /die, /das, /a1, /a2, /play/A1, /dictionary) — Phase 4's
 * "strategic internal linking graph" requirement, kept honest rather than guessed at.
 */

async function buildTop100A1Table(): Promise<string> {
  const rows = await db.select().from(words).where(eq(words.cefrLevel, "A1")).orderBy(asc(words.frequencyRank)).limit(100);
  const lines = rows.map((w) => {
    const nounSlug = w.slug.slice(w.article.length + 1);
    return `| [${w.article} ${w.noun}](/${w.article}/${nounSlug}) | ${w.translation} |`;
  });
  return ["| Noun | Translation |", "| --- | --- |", ...lines].join("\n");
}

const ARTICLE_1 = {
  slug: "12-german-gender-suffix-patterns",
  title: "12 German Gender Suffix Patterns That Help You Guess the Article",
  excerpt: "The 12 most reliable German noun suffixes for predicting der, die, or das — with the real exceptions named, not glossed over.",
  contentMarkdown: `Guessing a German noun's gender from its ending isn't a party trick — a handful of suffixes are consistent enough that native speakers lean on them without thinking. Here are 12 of the most useful ones, grouped by gender. For the full breakdown of reliable patterns versus statistical tendencies (and the real exceptions to each), see the [complete der, die, das guide](/der-die-das).

## Masculine (der) — 4 reliable suffixes

- **-ling** — der [Frühling](/der/fruehling) (spring), der Lehrling (apprentice), der Schmetterling (butterfly)
- **-or** — der [Motor](/der/motor), der [Doktor](/der/doktor), der [Direktor](/der/direktor)
- **-ismus** — der Journalismus, der Optimismus, der Kapitalismus
- **-ist** — der [Polizist](/der/polizist), der Tourist, der Artist

All four have no known exceptions in standard German — see the full list of [masculine noun patterns](/der).

## Feminine (die) — 4 reliable suffixes

- **-ung** — die [Zeitung](/die/zeitung) (newspaper), die Übung (exercise), die Meinung (opinion)
- **-heit** — die [Freiheit](/die/freiheit) (freedom), die Gesundheit (health)
- **-schaft** — die [Freundschaft](/die/freundschaft), die [Wissenschaft](/die/wissenschaft)
- **-tät** — die [Universität](/die/universitaet), die Qualität (quality)

Feminine has more genuinely exceptionless suffixes than either other gender — full list on the [feminine noun hub](/die).

## Neuter (das) — 4 reliable suffixes

- **-chen** — das [Mädchen](/das/maedchen) (girl), das [Brötchen](/das/broetchen) (bread roll)
- **-lein** — das [Fräulein](/das/fraeulein), das Büchlein (little book)
- **-ment** — das [Instrument](/das/instrument), das [Dokument](/das/dokument)
- **-um** — das [Museum](/das/museum), das [Zentrum](/das/zentrum), das [Visum](/das/visum)

-chen and -lein are diminutive suffixes: they make a noun neuter *regardless of the base word's own gender* — die Frau (woman) becomes das Fräulein, and der Tisch becomes das Tischchen. Full detail on the [neuter noun hub](/das).

## Why stop at 12?

These are the patterns with zero known counterexamples in standard German — the ones worth memorizing first. Beyond them there are strong *tendencies* (like -er and -en for masculine, or -o for neuter) that are right most of the time but do have real exceptions. The [complete guide](/der-die-das) covers both, clearly labeled, so you never mistake a lean for a rule.

Ready to put these to work? [Practice with A1 nouns](/play/A1) and see how often the pattern already tells you the answer before you guess.`,
};

const ARTICLE_2 = {
  slug: "der-die-das-core-rules-and-patterns",
  title: "Der, Die, or Das? The Core Rules and Patterns for German Articles",
  excerpt: "How to actually predict German noun gender — suffixes, semantic categories, and when the honest answer is just to memorize it.",
  contentMarkdown: `Every German noun carries one of three grammatical genders — masculine (*der*), feminine (*die*), or neuter (*das*) — and it affects far more than the article itself: adjective endings, pronouns, and case declension all follow from it. That makes gender one of the highest-leverage things to get right early. Here's the honest, three-part strategy for predicting it.

## 1. Suffixes — the most reliable signal

Certain noun endings predict gender with no known exceptions in standard German: **-ung, -heit, -keit, -schaft, -tät, -ion** are always [die](/die); **-ling, -or, -ismus, -ist** are always [der](/der); **-chen** and **-lein** are always [das](/das) (diminutives override the base word's own gender). Other endings like **-er**, **-en**, and **-o** are strong tendencies with real, commonly-cited exceptions — die [Mutter](/die/mutter), das [Fenster](/das/fenster), der [Euro](/der/euro) all break the pattern their ending suggests. The [full suffix guide](/der-die-das) separates all of these clearly, because treating a tendency as a rule is how learners end up more confused, not less.

## 2. Semantic categories — meaning predicts gender too

Some groups of nouns take the same article by meaning, not spelling:

- **der**: days of the week, months, seasons, compass directions — der [Montag](/der/montag), der [Januar](/der/januar), der [Sommer](/der/sommer), der [Winter](/der/winter), der [Norden](/der/norden), der [Süden](/der/sueden)
- **die**: most trees and flowers — die [Eiche](/die/eiche) (oak), die [Rose](/die/rose) — though real exceptions exist (der Ahorn, "maple")
- **das**: metals and chemical elements — das [Gold](/das/gold), das [Silber](/das/silber), das [Eisen](/das/eisen), das [Kupfer](/das/kupfer)

## 3. When there's no pattern — just learn noun and article together

Plenty of common nouns (der [Tisch](/der/tisch), das [Haus](/das/haus), die [Uhr](/die/uhr)) don't come from a predictable suffix or category at all. For these, the fastest path is to stop treating "the noun" and "its article" as two separate facts and learn them as one unit from the start — the whole case for [why article-first learning accelerates fluency](/blog/why-learn-german-nouns-with-articles).

Start with the [top 100 essential A1 nouns](/blog/top-100-essential-a1-german-nouns), browse the full [gender guide](/der-die-das), or jump straight into [A1 practice](/play/A1) and start testing yourself word by word.`,
};

const ARTICLE_4 = {
  slug: "compound-nouns-in-german-gender",
  title: "Compound Nouns in German: How the Base Noun Determines Gender",
  excerpt: "German compound nouns always take the gender of their last component — the Grundwort — no matter how many words come before it.",
  contentMarkdown: `German famously builds long compound nouns by chaining words together — and one rule governs every single one of them: **the gender of a compound noun is always the gender of its last component** (the *Grundwort*, or "base word"). Everything before it just modifies the meaning; it never changes the article.

## The rule in practice

- das [Haus](/das/haus) (house) + die Tür (door) → **die** Haustür (front door) — feminine, because Tür is last
- der [Tisch](/der/tisch) (table) + die Lampe (lamp) → **die** Tischlampe (table lamp) — feminine again
- die Schule (school) + der Bus (bus) → **der** Schulbus (school bus) — masculine, because Bus is last
- die [Zeitung](/die/zeitung) (newspaper) + der Artikel (article) → **der** Zeitungsartikel (newspaper article) — masculine

Notice the pattern: it doesn't matter what gender the first word (or words — compounds can chain three or four deep) originally had on its own. Only the very last piece counts.

## Why this rule is genuinely reliable

Unlike suffix patterns, which can have real exceptions, the "last element determines gender" rule for compounds has no known counterexamples in standard German — it's a structural fact about how German grammar works, not a statistical tendency. If you can identify the last standalone noun inside a compound, you know its gender with certainty, even for a compound you've never seen before.

## Using this to your advantage

This means you don't need to memorize compound nouns as unrelated vocabulary — you need to recognize their last component. Solid footing in the [core der, die, das patterns](/der-die-das) and the [masculine](/der), [feminine](/die), and [neuter](/das) hubs pays off twice: once for simple nouns, and again for every compound built on top of them.

Try it yourself: [practice A1 nouns](/play/A1) and watch for compounds — the moment you spot the last piece, you already know the article.`,
};

const ARTICLE_5 = {
  slug: "german-plural-formations-guide",
  title: "German Plural Formations: Matching Articles, Endings, and Umlauts",
  excerpt: "Every German plural pattern — no ending, umlaut-only, -e, -en, -er, -s, and the irregulars — with real examples and their articles.",
  contentMarkdown: `The article a noun takes in the singular (der, die, das) has no bearing on how it forms its plural — German plurals follow their own set of patterns, and every plural noun takes **die** regardless of its singular article. Here are the patterns that cover almost every noun you'll meet, each with a real, verified example.

## No ending

Some nouns are identical in the singular and plural — only the article (der/die/das → die) and context tell you which one is meant.

- das [Fenster](/das/fenster) → die Fenster (window → windows)

## Umlaut only

The ending stays the same, but a stem vowel (a/o/u) gains an umlaut.

- der [Apfel](/der/apfel) → die Äpfel (apple → apples)
- die [Mutter](/die/mutter) → die Mütter (mother → mothers)

## -e

- der [Tisch](/der/tisch) → die Tische (table → tables)

## -en / -n

The most common plural ending overall, especially for feminine nouns.

- die [Katze](/die/katze) → die Katzen (cat → cats)
- die [Zeitung](/die/zeitung) → die Zeitungen (newspaper → newspapers)
- die [Uhr](/die/uhr) → die Uhren (clock → clocks)

## -er (+ umlaut where possible)

Common for neuter nouns, and almost always paired with an umlaut if the stem vowel allows it.

- das [Haus](/das/haus) → die Häuser (house → houses)
- das [Buch](/das/buch) → die Bücher (book → books)
- der [Garten](/der/garten) → die Gärten (garden → gardens)

## -s

Mostly loanwords, especially ones ending in a vowel.

- das [Auto](/das/auto) → die Autos (car → cars)

## Irregular

A small set of nouns — often loanwords with a foreign plural pattern — don't fit any of the above.

- das [Museum](/das/museum) → die Museen (museum → museums)

## How to actually learn these

Trying to memorize "which ending goes with which noun" as an abstract rule is slower than it needs to be — the pattern is far easier to internalize when you see the singular and plural *together*, attached to the noun you're already learning the article for. Every noun page on this site — like [der Tisch](/der/tisch) or [das Haus](/das/haus) — shows the plural right next to the article for exactly this reason.

Browse the [full dictionary](/dictionary) or head to [A1 practice](/play/A1) to start seeing these patterns in real nouns.`,
};

const ARTICLE_6 = {
  slug: "why-learn-german-nouns-with-articles",
  title: "Why Learning German Nouns With Their Articles Accelerates Fluency",
  excerpt: "Treating a German noun and its article as one unit — not two separate facts — is what actually makes gender automatic.",
  contentMarkdown: `A common mistake for German learners is to treat vocabulary and grammar as two separate tracks: learn the word "Tisch," then separately try to remember that it's "der." In practice, this doubles the work and rarely sticks — because in German, gender isn't an add-on fact about a noun, it's baked into almost everything the noun touches.

## Gender isn't just the article

Once you commit to der [Tisch](/der/tisch), that single decision ripples outward:

- **Pronouns**: you refer back to it as *er* (he/it), not *sie* or *es*
- **Adjective endings**: "der **groß-e** Tisch" vs. "die **groß-e** Lampe" vs. "das **groß-e** Haus" — the same adjective takes a different ending depending on gender and case
- **Case declension**: "Ich sehe **den** Tisch" (accusative) only makes sense once you already know Tisch is masculine

If you learn "Tisch" and its gender as two separate pieces of information, you have to look both up again every time you need to build a sentence. If you learn "der Tisch" as one unit from day one, the gender is just there, the way it's there for a native speaker.

## The patterns make this easier than it sounds

This isn't pure rote memorization, either — a real share of German nouns are predictable from [suffix patterns](/der-die-das) (die [Zeitung](/die/zeitung), die [Freiheit](/die/freiheit), das [Mädchen](/das/maedchen)) or semantic categories (der [Montag](/der/montag), das [Gold](/das/gold)). Learning to notice these patterns — covered on the [masculine](/der), [feminine](/die), and [neuter](/das) hubs — means you're not memorizing thousands of arbitrary facts, just a few dozen patterns plus a shrinking pile of genuine exceptions.

## Start with the highest-frequency words

The fastest return on this approach comes from the words you'll use constantly. The [top 100 essential A1 nouns](/blog/top-100-essential-a1-german-nouns) is a good place to start — or jump straight into [A1 practice](/play/A1), where every session drills the noun and its article together, exactly as you'll need to recall them in real conversation.`,
};

async function main() {
  const top100Table = await buildTop100A1Table();

  const articles = [
    ARTICLE_1,
    ARTICLE_2,
    {
      slug: "top-100-essential-a1-german-nouns",
      title: "Top 100 Essential A1 German Nouns and Their Articles",
      excerpt: "The 100 highest-frequency A1 German nouns, each with its article, translation, and a link to practice — pulled directly from our dictionary data.",
      contentMarkdown: `These are the 100 highest-frequency nouns in our [A1 dictionary](/a1) — the words most worth learning first, each with its article already attached. Tap any noun to see its full page, complete with a [one-click quiz](/der-die-das) to test yourself immediately.

${top100Table}

Once these feel automatic, move on to [A2 vocabulary](/a2), or jump into a full [A1 practice session](/play/A1) to start drilling them for real.`,
    },
    ARTICLE_4,
    ARTICLE_5,
    ARTICLE_6,
  ];

  const now = new Date();
  for (const article of articles) {
    await db
      .insert(posts)
      .values({
        id: crypto.randomUUID(),
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        contentMarkdown: article.contentMarkdown,
        published: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: posts.slug,
        set: {
          title: article.title,
          excerpt: article.excerpt,
          contentMarkdown: article.contentMarkdown,
          published: true,
          updatedAt: now,
        },
      });
    console.log(`Seeded: ${article.slug}`);
  }

  console.log(`Done. ${articles.length} educational posts seeded/updated.`);
}

main().catch((err) => {
  console.error("seed-blog-posts failed:", err);
  process.exit(1);
});
