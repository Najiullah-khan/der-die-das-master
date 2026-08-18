export type CategoryId = "grammar" | "a1-vocabulary" | "a2-vocabulary" | "mastery-strategy" | "plurals-endings";

export interface Category {
  id: string;
  label: string;
  /** Full literal Tailwind classes — never composed from a variable at runtime, since
   * Tailwind's compiler only picks up class names it can find verbatim in source. */
  badgeClass: string;
  accentClass: string;
}

/** The fixed preset list the admin category dropdown and the `/blog` filter bar both render. */
export const CATEGORIES: Category[] = [
  { id: "grammar", label: "Grammar Guides", badgeClass: "bg-der/10 text-der dark:bg-der/20", accentClass: "bg-der" },
  { id: "a1-vocabulary", label: "A1 Vocabulary", badgeClass: "bg-das/10 text-das dark:bg-das/20", accentClass: "bg-das" },
  {
    id: "a2-vocabulary",
    label: "A2 Vocabulary",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    accentClass: "bg-amber-500",
  },
  { id: "mastery-strategy", label: "Mastery Strategy", badgeClass: "bg-die/10 text-die dark:bg-die/20", accentClass: "bg-die" },
  {
    id: "plurals-endings",
    label: "Plurals & Endings",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    accentClass: "bg-violet-500",
  },
];

const CUSTOM_CATEGORY_STYLE = {
  badgeClass: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  accentClass: "bg-neutral-400",
};

const DEFAULT_CATEGORY_ID: CategoryId = "grammar";

/**
 * Fallback for posts seeded before the `posts.category` column existed
 * (scripts/seed-blog-posts.ts writes the column directly now — this only covers rows from
 * before that migration, so older content doesn't show up uncategorized).
 */
const LEGACY_CATEGORY: Record<string, CategoryId> = {
  "12-german-gender-suffix-patterns": "grammar",
  "der-die-das-core-rules-and-patterns": "grammar",
  "top-100-essential-a1-german-nouns": "a1-vocabulary",
  "compound-nouns-in-german-gender": "grammar",
  "german-plural-formations-guide": "plurals-endings",
  "why-learn-german-nouns-with-articles": "mastery-strategy",
  "secret-grouping-method-german-articles": "mastery-strategy",
};

/**
 * Resolves a post's category for display: the DB column wins when set (matched against a
 * preset's id or label), then the legacy slug map, then the default. A value that matches
 * neither a preset id nor label is treated as the admin's free-text "custom" category — shown
 * verbatim with a neutral style rather than silently coerced into a preset.
 */
export function resolvePostCategory(post: { slug: string; category: string | null }): Category {
  const raw = post.category ?? LEGACY_CATEGORY[post.slug];
  if (!raw) return getCategory(DEFAULT_CATEGORY_ID);

  const preset = CATEGORIES.find((c) => c.id === raw || c.label === raw);
  if (preset) return preset;

  return { id: raw, label: raw, ...CUSTOM_CATEGORY_STYLE };
}

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? { id, label: id, ...CUSTOM_CATEGORY_STYLE };
}

export type PostFormat = "guide" | "quick-read";

/** Listicle/reference-style posts get the compact horizontal "Quick Reads" treatment on
 * `/blog` instead of the standard guide grid card. Not admin-editable (yet) — purely an
 * editorial/structural classification, unlike category. */
const QUICK_READ_SLUGS = new Set(["12-german-gender-suffix-patterns", "top-100-essential-a1-german-nouns"]);

export function getPostFormat(slug: string): PostFormat {
  return QUICK_READ_SLUGS.has(slug) ? "quick-read" : "guide";
}
