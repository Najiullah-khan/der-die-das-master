import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BookOpen, Clock } from "lucide-react";
import { getPublishedPostBySlug } from "@/lib/db/queries/posts";
import { renderMarkdown } from "@/lib/blog/markdown";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { resolvePostCategory } from "@/lib/blog/category";
import { ARTICLE_PROSE_CLASS } from "@/lib/blog/prose-classes";
import { buildPostStructuredData } from "@/lib/seo/structured-data";
import { getSiteUrl } from "@/lib/seo/site-url";
import { JsonLd } from "@/components/seo/JsonLd";
import { PostCta } from "@/components/blog/PostCta";

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
  // Admin-set SEO overrides win when present (PostForm's "SEO Meta Title & Description"
  // fields); otherwise this falls back to the exact title/excerpt behavior every existing
  // post already had, so unset fields never change existing metadata output.
  const title = post.metaTitle ?? `${post.title} | Der-Die-Das Master Blog`;
  const description = post.metaDescription ?? post.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: pageUrl,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
  const category = resolvePostCategory(post);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={structuredData} />

      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-1 text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/blog" className="hover:underline">
          Learning Hub
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/blog?category=${category.id}`} className="hover:underline">
          {category.label}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-neutral-700 dark:text-neutral-300">{post.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.badgeClass}`}>{category.label}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <BookOpen className="h-3 w-3" aria-hidden />
          Der-Die-Das Editorial
        </span>
        <time dateTime={post.createdAt.toISOString()}>{post.createdAt.toLocaleDateString()}</time>
        <span aria-hidden>&middot;</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <Clock className="h-3 w-3" aria-hidden />
          {readingTime} min read
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{post.title}</h1>

      <div className={`mt-8 ${ARTICLE_PROSE_CLASS}`} dangerouslySetInnerHTML={{ __html: html }} />

      <PostCta />
    </main>
  );
}
