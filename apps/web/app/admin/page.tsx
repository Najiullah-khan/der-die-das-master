import { headers } from "next/headers";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminUser } from "@/lib/auth/admin";
import { getAllPostsForAdmin } from "@/lib/db/queries/posts";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { PostsTable } from "@/components/admin/PostsTable";

export const metadata: Metadata = { title: "Admin – Der-Die-Das Master", robots: { index: false, follow: false } };

// Session-gated, never cached (blueprint §1 CSR/authenticated pattern, same as /dashboard).
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requestHeaders = await headers();
  const user = await getCurrentUser(requestHeaders);

  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <SignInPrompt />
      </main>
    );
  }

  const admin = await getAdminUser(requestHeaders);
  if (!admin) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const posts = await getAllPostsForAdmin();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <div className="flex items-center gap-4">
          <a href="/admin/feedback" className="text-sm text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300">
            Feedback & Bugs
          </a>
          <a
            href="/admin/new"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create New Post
          </a>
        </div>
      </div>

      <PostsTable
        posts={posts.map((p) => ({
          ...p,
          createdAt: p.createdAt.getTime(),
          updatedAt: p.updatedAt.getTime(),
        }))}
      />
    </main>
  );
}
