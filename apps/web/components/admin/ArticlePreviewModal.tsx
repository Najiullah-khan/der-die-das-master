"use client";

import { X } from "lucide-react";
import { renderMarkdown } from "@/lib/blog/markdown";
import { ARTICLE_PROSE_CLASS } from "@/lib/blog/prose-classes";

interface ArticlePreviewModalProps {
  title: string;
  contentMarkdown: string;
  onClose: () => void;
}

/** Renders the current (possibly unsaved) draft exactly as `/blog/[slug]` would, client-side —
 * that route only serves published posts, so a draft preview can't just open the real URL. */
export function ArticlePreviewModal({ title, contentMarkdown, onClose }: ArticlePreviewModalProps) {
  const html = renderMarkdown(contentMarkdown);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-950 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          Draft preview
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title || "Untitled post"}</h1>
        <div className={`mt-8 ${ARTICLE_PROSE_CLASS}`} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
