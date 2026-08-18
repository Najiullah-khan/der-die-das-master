import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { resolvePostCategory } from "@/lib/blog/category";

interface PostCardPost {
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  category: string | null;
  createdAt: Date;
}

/** Standard grid card for "Comprehensive Guides" on `/blog` — see QuickReadCard for the
 * compact listicle/reference variant, and FeaturedPost for the top spotlight card. */
export function PostCard({ post }: { post: PostCardPost }) {
  const category = resolvePostCategory(post);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-der/40 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900"
    >
      <span className={`h-1.5 w-full shrink-0 ${category.accentClass}`} aria-hidden />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${category.badgeClass}`}>{category.label}</span>
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug transition-colors group-hover:text-der">{post.title}</h3>
        <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2.5">
            <time dateTime={new Date(post.createdAt).toISOString()}>{new Date(post.createdAt).toLocaleDateString()}</time>
            <span aria-hidden>&middot;</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {estimateReadingTime(post.contentMarkdown)} min read
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-der">
            Read Guide
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
