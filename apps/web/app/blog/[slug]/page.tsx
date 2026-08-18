import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Clock } from "lucide-react";
import { getPublishedPostBySlug } from "@/lib/db/queries/posts";
import { renderMarkdown } from "@/lib/blog/markdown";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { buildPostStructuredData } from "@/lib/seo/structured-data";
import { getSiteUrl } from "@/lib/seo/site-url";
import { JsonLd } from "@/components/seo/JsonLd";
import { GameCta } from "@/components/blog/GameCta";

export const revalidate = 3600; // ISR: posts change rarely (blueprint §1 SSG/ISR pattern)

export async function generateStaticParams() {
  const rows = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.published, true));
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const pageUrl = `${getSiteUrl()}/blog/${post.slug}`;

  return {
    title: `${post.title} | Der-Die-Das Master Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: pageUrl,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const structuredData = buildPostStructuredData({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    createdAt: post.createdAt.getTime(),
    updatedAt: post.updatedAt.getTime(),
  });
  const html = renderMarkdown(post.contentMarkdown);
  const readingTime = estimateReadingTime(post.contentMarkdown);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <JsonLd data={structuredData} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <a href="/" className="hover:underline">
          Home
        </a>{" "}
        /{" "}
        <a href="/blog" className="hover:underline">
          Blog
        </a>{" "}
        / <span className="text-neutral-700 dark:text-neutral-300">{post.title}</span>
      </nav>

      <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
      <div className="mt-3 flex items-center gap-3 text-sm text-neutral-500">
        <time dateTime={post.createdAt.toISOString()}>{post.createdAt.toLocaleDateString()}</time>
        <span aria-hidden>&middot;</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <Clock className="h-3 w-3" aria-hidden />
          {readingTime} min read
        </span>
      </div>

      <div
        className="mt-8 [&_a]:text-der [&_a]:underline
          [&_blockquote]:my-6 [&_blockquote]:rounded-xl [&_blockquote]:border-l-4 [&_blockquote]:border-der [&_blockquote]:bg-neutral-50 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:italic dark:[&_blockquote]:bg-neutral-900
          [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-neutral-800
          [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold
          [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6
          [&_p]:my-4 [&_p]:leading-relaxed
          [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-100 [&_pre]:p-4 dark:[&_pre]:bg-neutral-900
          [&_table]:my-6 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:rounded-lg [&_table]:border [&_table]:border-neutral-200 [&_table]:text-sm dark:[&_table]:border-neutral-800
          [&_th]:border-b [&_th]:border-neutral-200 [&_th]:bg-neutral-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold dark:[&_th]:border-neutral-800 dark:[&_th]:bg-neutral-800
          [&_td]:border-b [&_td]:border-neutral-100 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-neutral-900
          [&_tbody_tr:nth-child(even)]:bg-neutral-50 dark:[&_tbody_tr:nth-child(even)]:bg-neutral-900/60
          [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <GameCta />
    </main>
  );
}
