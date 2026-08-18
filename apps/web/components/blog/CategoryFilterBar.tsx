import Link from "next/link";
import { CATEGORIES } from "@/lib/blog/category";

function pillClass(isActive: boolean): string {
  return `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-der text-white"
      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
  }`;
}

/** Crawlable `?category=` filter pills on `/blog` — real links, not client state, so a shared
 * or bookmarked filtered URL always resolves server-side to the right set of posts. */
export function CategoryFilterBar({ active }: { active?: string }) {
  return (
    <nav
      aria-label="Filter articles by category"
      className="flex gap-2 overflow-x-auto px-6 pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
    >
      <Link href="/blog" aria-current={!active ? "page" : undefined} className={pillClass(!active)}>
        All
      </Link>
      {CATEGORIES.map((category) => (
        <Link
          key={category.id}
          href={`/blog?category=${category.id}`}
          aria-current={active === category.id ? "page" : undefined}
          className={pillClass(active === category.id)}
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
}
