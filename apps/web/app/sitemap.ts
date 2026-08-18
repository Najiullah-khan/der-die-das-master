import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { words } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/seo/site-url";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { PLAYABLE_LEVELS } from "@/lib/game-engine/levels";
import { wordPath } from "@/lib/seo/word-url";

// A single file comfortably covers this dataset (a few thousand words, well under the
// 50,000-URL sitemap limit). If the word count ever approaches that, switch to Next's
// `generateSitemaps()` chunking (blueprint §8.2) — this shape doesn't need to change to add it.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/play`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/dictionary`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/der-die-das`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/der`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/die`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/das`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/a1`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/a2`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/b1`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/b2`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/attributions`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Only levels with real seeded vocabulary (blueprint's thin-content SEO risk note) — the two
  // Coming Soon levels (C1/C2) have no words to practice yet, so they stay out of the sitemap
  // until PLAYABLE_LEVELS grows to include them.
  const playLevelRoutes: MetadataRoute.Sitemap = PLAYABLE_LEVELS.map((level) => ({
    url: `${siteUrl}/play/${level}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const [rows, publishedPosts] = await Promise.all([
    db.select({ slug: words.slug, article: words.article, createdAt: words.createdAt }).from(words),
    getPublishedPosts(),
  ]);
  const wordRoutes: MetadataRoute.Sitemap = rows.map((word) => ({
    url: `${siteUrl}${wordPath(word)}`,
    lastModified: word.createdAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const postRoutes: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...playLevelRoutes, ...wordRoutes, ...postRoutes];
}
