import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { resolvePostCategory } from "@/lib/blog/category";

interface QuickReadCardPost {
  slug: string;
  title: string;
  contentMarkdown: string;
  category: string | null;
  createdAt: Date;
}

/** Compact horizontal card for listicle/reference-style posts (lib/blog/category.ts's
 * getPostFormat) — denser than PostCard, since these are meant to be scanned as a list. */
export function QuickReadCard({ post }: { post: QuickReadCardPost }) {
  const category = resolvePostCategory(post);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-der/40 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900"
    >
      <span className={`h-10 w-1.5 shrink-0 rounded-full ${category.accentClass}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold transition-colors group-hover:text-der">{post.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
          <time dateTime={new Date(post.createdAt).toISOString()}>{new Date(post.createdAt).toLocaleDateString()}</time>
          <span aria-hidden>&middot;</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {estimateReadingTime(post.contentMarkdown)} min
          </span>
        </div>
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-der"
        aria-hidden
      />
    </Link>
  );
}
