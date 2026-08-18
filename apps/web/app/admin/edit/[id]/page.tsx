import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminUser } from "@/lib/auth/admin";
import { getPostById } from "@/lib/db/queries/posts";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { PostForm } from "@/components/admin/PostForm";

export const metadata: Metadata = { title: "Edit Post – Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Edit Post</h1>
      <div className="mt-6">
        <PostForm
          mode="edit"
          post={{ ...post, createdAt: post.createdAt.getTime(), updatedAt: post.updatedAt.getTime() }}
        />
      </div>
    </main>
  );
}
