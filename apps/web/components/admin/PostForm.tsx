"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@ddd/shared";
import type { Post } from "@ddd/shared";
import { CATEGORIES } from "@/lib/blog/category";
import { estimateReadingTime } from "@/lib/blog/reading-time";
import { PostCard } from "@/components/blog/PostCard";
import { SerpPreview } from "@/components/admin/SerpPreview";
import { ArticlePreviewModal } from "@/components/admin/ArticlePreviewModal";

interface PostFormProps {
  mode: "create" | "edit";
  post?: Post;
}

const CUSTOM_CATEGORY_VALUE = "__custom__";

export function PostForm({ mode, post }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [contentMarkdown, setContentMarkdown] = useState(post?.contentMarkdown ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [published, setPublished] = useState(post?.published ?? false);

  const initialIsPreset = !post?.category || CATEGORIES.some((c) => c.id === post.category);
  const [categorySelect, setCategorySelect] = useState(
    post?.category && initialIsPreset ? post.category : post?.category ? CUSTOM_CATEGORY_VALUE : CATEGORIES[0].id,
  );
  const [customCategory, setCustomCategory] = useState(post?.category && !initialIsPreset ? post.category : "");
  const category = categorySelect === CUSTOM_CATEGORY_VALUE ? customCategory.trim() || null : categorySelect;

  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function persist(publishOverride: boolean): Promise<boolean> {
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    const body = {
      title,
      slug,
      excerpt,
      contentMarkdown,
      category,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      published: publishOverride,
    };

    const url = mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${post!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return false;
    }

    setPublished(publishOverride);
    return true;
  }

  async function handleSaveDraft() {
    if (await persist(false)) {
      setSavedMessage("Draft saved.");
      router.refresh();
    }
  }

  async function handlePublish() {
    if (await persist(true)) {
      router.push("/admin");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!post) return;
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const wordCount = useMemo(() => contentMarkdown.trim().split(/\s+/).filter(Boolean).length, [contentMarkdown]);
  const readingTime = useMemo(() => estimateReadingTime(contentMarkdown || " "), [contentMarkdown]);

  const previewPost = {
    id: post?.id ?? "preview",
    slug: slug || "preview",
    title: title || "Untitled post",
    excerpt: excerpt || "Your excerpt will appear here.",
    contentMarkdown,
    category,
    createdAt: post ? new Date(post.createdAt) : new Date(),
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSaveDraft();
      }}
      className="pb-16"
    >
      {/* Sticky header action bar */}
      <div className="sticky top-0 z-10 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              published
                ? "bg-das/10 text-das dark:bg-das/20"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>
          {savedMessage && <span className="text-xs text-neutral-500">{savedMessage}</span>}
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDraft}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={!contentMarkdown.trim()}
            onClick={() => setPreviewOpen(true)}
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          >
            Preview Article
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handlePublish}
            className="rounded-full bg-der px-5 py-2 text-sm font-semibold text-white hover:bg-der-strong disabled:opacity-50"
          >
            Publish Post
          </button>
          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Left: editor form */}
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Title</span>
            <input
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">URL Slug</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className="rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Category</span>
            <select
              value={categorySelect}
              onChange={(e) => setCategorySelect(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY_VALUE}>Custom…</option>
            </select>
            {categorySelect === CUSTOM_CATEGORY_VALUE && (
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Custom category name"
                className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            )}
          </div>

          <label className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">Excerpt</span>
              <span className="text-xs text-neutral-500">{excerpt.length}/500</span>
            </div>
            <textarea
              required
              rows={2}
              maxLength={500}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Content (Markdown)</span>
            <textarea
              required
              rows={22}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm leading-relaxed dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm font-semibold">SEO overrides (optional)</p>
            <p className="mt-1 text-xs text-neutral-500">Leave blank to fall back to the title/excerpt above.</p>

            <label className="mt-3 flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Meta Title</span>
                <span className="text-xs text-neutral-500">{metaTitle.length}/70</span>
              </div>
              <input
                maxLength={70}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>

            <label className="mt-3 flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Meta Description</span>
                <span className="text-xs text-neutral-500">{metaDescription.length}/160</span>
              </div>
              <textarea
                rows={2}
                maxLength={160}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
          </div>
        </div>

        {/* Right: live preview & inspector */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Blog Card Preview</p>
            <div className="pointer-events-none mt-2 max-w-sm">
              <PostCard post={previewPost} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-500">Google Search Preview</p>
            <div className="mt-2">
              <SerpPreview title={metaTitle || title} slug={slug} description={metaDescription || excerpt} />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <p className="font-semibold">Content stats</p>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <dt className="text-xs text-neutral-500">Words</dt>
                <dd className="font-semibold">{wordCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Characters</dt>
                <dd className="font-semibold">{contentMarkdown.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Read time</dt>
                <dd className="font-semibold">{readingTime} min</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {previewOpen && (
        <ArticlePreviewModal title={title} contentMarkdown={contentMarkdown} onClose={() => setPreviewOpen(false)} />
      )}
    </form>
  );
}
