import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { buildMetadata } from "@/lib/seo/metadata";
import { resolvePostCategory, getPostFormat } from "@/lib/blog/category";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { PostCard } from "@/components/blog/PostCard";
import { QuickReadCard } from "@/components/blog/QuickReadCard";
import { CategoryFilterBar } from "@/components/blog/CategoryFilterBar";

export const revalidate = 3600; // ISR: posts change rarely (blueprint §1 SSG/ISR pattern)

export const metadata = buildMetadata({
  title: "Blog – Der-Die-Das Master",
  description: "Tips, guides, and deep dives on mastering German noun genders (der, die, das).",
  path: "/blog",
});

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allPosts = await getPublishedPosts();
  const posts = category ? allPosts.filter((p) => resolvePostCategory(p).id === category) : allPosts;

  const [featured, ...rest] = posts;
  const guides = rest.filter((p) => getPostFormat(p.slug) === "guide");
  const quickReads = rest.filter((p) => getPostFormat(p.slug) === "quick-read");

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-radial from-der/10 via-transparent to-transparent" aria-hidden />
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-der/10 px-4 py-1.5 text-sm font-medium text-der dark:bg-der/20">
            📚 Der Die Das Learning Hub
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">German Articles &amp; Grammar, Decoded</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
            Practical rules, mnemonic systems, and level-by-level vocabulary guides to master der, die, and das.
          </p>
        </div>

        <div className="mx-auto max-w-4xl pb-8">
          <CategoryFilterBar active={category} />
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl px-6 pb-20">
        {allPosts.length === 0 ? (
          <p className="mt-8 text-center text-neutral-500">No posts yet — check back soon.</p>
        ) : posts.length === 0 ? (
          <p className="mt-8 text-center text-neutral-500">
            No articles in this category yet.{" "}
            <Link href="/blog" className="font-medium text-der hover:underline">
              View all articles
            </Link>
          </p>
        ) : (
          <>
            <FeaturedPost post={featured} />

            {guides.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold">Comprehensive Guides</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {guides.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {quickReads.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold">Quick Reads &amp; Vocabulary Lists</h2>
                <div className="mt-4 flex flex-col gap-3">
                  {quickReads.map((post) => (
                    <QuickReadCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="mt-16 rounded-3xl border border-neutral-200 bg-linear-to-br from-der/10 via-die/5 to-das/10 p-10 text-center shadow-sm dark:border-neutral-800">
          <h2 className="text-2xl font-bold">Put Theory Into Practice</h2>
          <p className="mx-auto mt-2 max-w-md text-neutral-600 dark:text-neutral-300">
            Don&apos;t just read the rules — build muscle memory with rapid 10-word quiz sessions.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/play/A1"
              className="inline-flex items-center gap-1.5 rounded-full bg-der px-8 py-3.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-der-strong"
            >
              Start A1 Practice
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/dictionary"
              className="rounded-full border border-neutral-300 px-8 py-3.5 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Browse Dictionary
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
