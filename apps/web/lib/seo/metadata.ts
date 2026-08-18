import type { Metadata } from "next";
import { getSiteUrl } from "./site-url";

interface BuildMetadataOptions {
  title: string;
  description: string;
  /** Root-relative, e.g. "/dictionary" or "/play/A1". */
  path: string;
  type?: "website" | "article";
  /** Private/no-SEO-value pages (blueprint §1: "/dashboard, /profile ... No SEO value"). */
  noIndex?: boolean;
}

/**
 * A page's own `openGraph`/`twitter` block always fully *replaces* whatever the root layout
 * declares — Next doesn't deep-merge them field-by-field across segments (confirmed in
 * node_modules/next/dist/docs/.../generate-metadata.md: "All openGraph fields ... are replaced").
 * So every page that wants correct OG tags needs a complete block of its own, not a partial
 * override assuming inheritance fills the gaps — that's what this helper is for.
 *
 * `images` is set explicitly to the root `opengraph-image` route rather than left for Next's
 * file-convention auto-injection to supply: verified against a real production build that once a
 * page sets its own `openGraph` object (as every caller of this helper does), the root
 * `app/opengraph-image.tsx` fallback stops being attached automatically — so every page needs its
 * own explicit reference. Only `/word/[slug]` overrides this, with its own per-word image.
 */
export function buildMetadata({ title, description, path, type = "website", noIndex = false }: BuildMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;
  const image = { url: `${siteUrl}/opengraph-image`, width: 1200, height: 630 };

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      url,
      siteName: "Der-Die-Das Master",
      type,
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
