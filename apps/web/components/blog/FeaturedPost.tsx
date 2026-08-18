import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { resolvePostCategory } from "@/lib/blog/category";

interface FeaturedPostPost {
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  category: string | null;
  createdAt: Date;
}

/** Full-width spotlight card for the latest post on `/blog`, above the guides grid — the one
 * place that keeps the full der/die/das brand gradient rather than a single category accent. */
export function FeaturedPost({ post }: { post: FeaturedPostPost }) {
  const category = resolvePostCategory(post);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-neutral-200/80 bg-linear-to-br from-der/5 via-transparent to-das/5 p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-der/40 hover:shadow-lg dark:border-neutral-800/80 sm:p-10"
    >
      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${category.badgeClass}`}>{category.label}</span>
      <h2 className="mt-4 text-2xl font-bold leading-tight transition-colors group-hover:text-der sm:text-3xl">
        {post.title}
      </h2>
      <p className="mt-3 line-clamp-2 max-w-2xl text-neutral-600 dark:text-neutral-300">{post.excerpt}</p>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
        <time dateTime={new Date(post.createdAt).toISOString()}>{new Date(post.createdAt).toLocaleDateString()}</time>
        <span aria-hidden>&middot;</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" aria-hidden />
          {estimateReadingTime(post.contentMarkdown)} min read
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-der px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-der-strong">
          Read Article
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
