"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@ddd/shared";

export function PostsTable({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePublish(post: Post) {
    setPendingId(post.id);
    setError(null);
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update");
      return;
    }
    router.refresh();
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setPendingId(post.id);
    setError(null);
    const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete");
      return;
    }
    router.refresh();
  }

  if (posts.length === 0) {
    return <p className="mt-8 text-sm text-neutral-500">No posts yet.</p>;
  }

  return (
    <div className="mt-8 overflow-x-auto">
      {error && (
        <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
            <th className="py-2 pr-4 font-medium">Title</th>
            <th className="py-2 pr-4 font-medium">Slug</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Created</th>
            <th className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-3 pr-4 font-medium">{post.title}</td>
              <td className="py-3 pr-4 font-mono text-xs text-neutral-500">{post.slug}</td>
              <td className="py-3 pr-4">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    post.published
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="py-3 pr-4 text-neutral-500">{new Date(post.createdAt).toLocaleDateString()}</td>
              <td className="py-3">
                <div className="flex flex-wrap gap-2">
                  <a href={`/admin/edit/${post.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                    Edit
                  </a>
                  <button
                    type="button"
                    disabled={pendingId === post.id}
                    onClick={() => togglePublish(post)}
                    className="text-neutral-600 hover:underline disabled:opacity-50 dark:text-neutral-300"
                  >
                    {post.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === post.id}
                    onClick={() => deletePost(post)}
                    className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
