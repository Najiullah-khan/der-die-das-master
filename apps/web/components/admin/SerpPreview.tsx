import { getSiteUrl } from "@/lib/seo/site-url";

interface SerpPreviewProps {
  title: string;
  slug: string;
  description: string;
}

/** Google-style search result mockup — helps an editor judge title/description length and
 * phrasing without leaving the form. */
export function SerpPreview({ title, slug, description }: SerpPreviewProps) {
  const url = `${getSiteUrl()}/blog/${slug || "your-slug"}`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">{url}</p>
      <p className="mt-1 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{title || "Untitled post"}</p>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
        {description || "Add an excerpt or meta description to see it here."}
      </p>
    </div>
  );
}
