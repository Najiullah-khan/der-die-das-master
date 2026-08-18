/** Absolute origin used for canonical URLs, sitemap entries, and structured data. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
