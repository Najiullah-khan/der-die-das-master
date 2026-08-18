import type { Article } from "@ddd/shared";

const GENDER_LABEL: Record<Article, string> = { der: "masculine", die: "feminine", das: "neuter" };

// Suffix -> hint, checked in order (most specific/reliable first). Not exhaustive — German
// gender has plenty of exceptions — just the well-known patterns worth surfacing as a memory aid
// (blueprint §8.3: "templated by gender + semantic category", generated offline-cheap, no AI — §12).
const SUFFIX_HINTS: Record<Article, Array<[string, string]>> = {
  der: [
    ["ling", "nouns ending in -ling are masculine"],
    ["ismus", "nouns ending in -ismus are masculine"],
    ["or", "nouns ending in -or are usually masculine"],
    ["er", "agent nouns ending in -er (the doer of something) are masculine"],
  ],
  die: [
    ["ung", "nouns ending in -ung are (almost) always feminine"],
    ["heit", "nouns ending in -heit are feminine"],
    ["keit", "nouns ending in -keit are feminine"],
    ["schaft", "nouns ending in -schaft are feminine"],
    ["tion", "nouns ending in -tion are feminine"],
    ["tät", "nouns ending in -tät are feminine"],
    ["ie", "nouns ending in -ie are usually feminine"],
    ["in", "the -in suffix marking a feminine person/role is feminine"],
    ["e", "many nouns ending in -e are feminine"],
  ],
  das: [
    ["chen", "diminutives ending in -chen are always neuter"],
    ["lein", "diminutives ending in -lein are always neuter"],
    ["ment", "nouns ending in -ment are usually neuter"],
    ["tum", "nouns ending in -tum are usually neuter"],
    ["um", "nouns ending in -um are usually neuter"],
  ],
};

/** A one-line memory hint for a noun's gender, templated by suffix pattern (blueprint §8.3). */
export function getGenderMnemonic(article: Article, noun: string): string {
  const lower = noun.toLowerCase();
  const hint = SUFFIX_HINTS[article].find(([suffix]) => lower.endsWith(suffix));

  if (hint) {
    return `${capitalize(article)} ${noun} is ${GENDER_LABEL[article]} — ${hint[1]}.`;
  }
  return `${capitalize(article)} ${noun} is ${GENDER_LABEL[article]}. There's no reliable ending pattern here, so it's worth memorizing this one directly.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
