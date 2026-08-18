import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Reusable in-article practice panel — the interactive footer widget on every `/blog/[slug]`
 * article, positioned directly below the conclusion. */
export function PostCta() {
  return (
    <div className="mt-12">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-linear-to-br from-der/10 via-die/5 to-das/10 p-8 text-center shadow-sm dark:border-neutral-800">
        <h2 className="text-xl font-bold">Ready to put this rule into practice?</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
          Test your article recall with 10 interactive nouns matching this topic.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/play/A1"
            className="inline-flex items-center gap-1.5 rounded-full bg-der px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-der-strong"
          >
            Start Practice Session
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/dictionary"
            className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Explore Matching Nouns in Dictionary
          </Link>
        </div>
      </div>

      <Link href="/blog" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-der hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to all articles
      </Link>
    </div>
  );
}
