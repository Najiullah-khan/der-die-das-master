import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { estimateReadingTime } from "@/lib/blog/reading-time";

export const revalidate = 3600; // ISR: posts change rarely (blueprint §1 SSG/ISR pattern)

export const metadata: Metadata = {
  title: "Blog – Der-Die-Das Master",
  description: "Tips, guides, and deep dives on mastering German noun genders (der, die, das).",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">
        Tips and guides for mastering German noun genders.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 text-neutral-500">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-neutral-200 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:hover:border-neutral-700"
            >
              <h2 className="text-lg font-semibold transition-colors group-hover:text-der">{post.title}</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{post.excerpt}</p>
              <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-neutral-500">
                <time dateTime={new Date(post.createdAt).toISOString()}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </time>
                <span aria-hidden>&middot;</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <Clock className="h-3 w-3" aria-hidden />
                  {estimateReadingTime(post.contentMarkdown)} min read
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
