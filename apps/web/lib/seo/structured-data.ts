import type { Article, CefrLevel } from "@ddd/shared";
import { getSiteUrl } from "./site-url";
import { wordPath } from "./word-url";

interface StructuredDataPost {
  slug: string;
  title: string;
  excerpt: string;
  createdAt: number;
  updatedAt: number;
}

/** BlogPosting JSON-LD for a `/blog/[slug]` post (blog spec §4: "SEO & Schema"). */
export function buildPostStructuredData(post: StructuredDataPost) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/blog/${post.slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: pageUrl,
      mainEntityOfPage: pageUrl,
      datePublished: new Date(post.createdAt).toISOString(),
      dateModified: new Date(post.updatedAt).toISOString(),
      inLanguage: "en",
      publisher: {
        "@type": "Organization",
        name: "Der-Die-Das Master",
        url: siteUrl,
      },
    },
  ];
}

/**
 * WebSite JSON-LD with a SearchAction (blueprint §8.1's sitewide-search guidance) — lets Google
 * offer a search box for this site directly in results. `target` points at `/dictionary`, the
 * only route that actually reads a `q` query param and filters (CodexBrowser's `initialSearch`).
 */
export function buildWebSiteStructuredData() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Der-Die-Das Master",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/dictionary?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** WebApplication + Course JSON-LD for the homepage — the two schema.org types that best fit a free, browser-based learning tool (blueprint §8.1's structured-data guidance, applied to `/` rather than a word page). */
export function buildHomeStructuredData(wordCount: number) {
  const siteUrl = getSiteUrl();

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Der-Die-Das Master",
    url: siteUrl,
    description: "Learn German noun genders (der, die, das) through a fast, gamified practice loop.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "German Noun Gender Practice",
    description: `Practice der, die, and das across ${wordCount.toLocaleString()} German nouns, from A1 essentials to advanced vocabulary.`,
    provider: { "@type": "Organization", name: "Der-Die-Das Master", url: siteUrl },
    url: `${siteUrl}/play`,
    inLanguage: "de",
    isAccessibleForFree: true,
  };

  return [webApplication, course];
}

const GENDER_LABEL: Record<Article, string> = { der: "masculine", die: "feminine", das: "neuter" };

interface StructuredDataWord {
  noun: string;
  slug: string;
  article: Article;
  plural: string;
  translation: string;
  cefrLevel: CefrLevel;
}

/**
 * DefinedTerm + FAQPage + BreadcrumbList JSON-LD for a word page (blueprint §8.1). The FAQ
 * block directly answers "Is X der, die, or das?" — the exact query pattern these pages target.
 */
export function buildWordStructuredData(word: StructuredDataWord) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${wordPath(word)}`;

  const definedTerm = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: `${word.article} ${word.noun}`,
    description: `${word.article} ${word.noun} (${GENDER_LABEL[word.article]}) means "${word.translation}" in English. Plural: die ${word.plural}.`,
    inDefinedTermSet: `${siteUrl}/dictionary`,
    inLanguage: "de",
    url: pageUrl,
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${word.noun} der, die, or das?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${word.noun} is ${word.article} ${word.noun} — ${GENDER_LABEL[word.article]}. It means "${word.translation}" and the plural is die ${word.plural}.`,
        },
      },
    ],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: word.cefrLevel, item: `${siteUrl}/dictionary?level=${word.cefrLevel}` },
      { "@type": "ListItem", position: 3, name: `${word.article} ${word.noun}`, item: pageUrl },
    ],
  };

  return [definedTerm, faq, breadcrumb];
}
