"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@ddd/shared";
import type { Post } from "@ddd/shared";

interface PostFormProps {
  mode: "create" | "edit";
  post?: Post;
}

export function PostForm({ mode, post }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [contentMarkdown, setContentMarkdown] = useState(post?.contentMarkdown ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSave(publishOverride?: boolean) {
    setSaving(true);
    setError(null);

    const body = {
      title,
      slug,
      excerpt,
      contentMarkdown,
      published: publishOverride ?? published,
    };

    const url = mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${post!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="mt-8 flex flex-col gap-5"
    >
      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

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
        <span className="text-sm font-medium">Slug</span>
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

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Excerpt</span>
        <textarea
          required
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Content (Markdown)</span>
        <textarea
          required
          rows={16}
          value={contentMarkdown}
          onChange={(e) => setContentMarkdown(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Published
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
        {!published && (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setPublished(true);
              handleSave(true);
            }}
            className="rounded-full border border-neutral-300 px-6 py-2.5 font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Save & Publish
          </button>
        )}
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto rounded-full border border-red-300 px-6 py-2.5 font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
