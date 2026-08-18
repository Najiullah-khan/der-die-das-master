import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";

export async function getAllPostsForAdmin() {
  return db.select().from(posts).orderBy(desc(posts.createdAt));
}

export async function getPostById(id: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return post ?? null;
}

export async function getPostBySlug(slug: string) {
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return post ?? null;
}

export async function getPublishedPosts() {
  return db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.createdAt));
}

export async function getPublishedPostBySlug(slug: string) {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.published, true)))
    .limit(1);
  return post ?? null;
}

export async function isSlugTaken(slug: string, excludeId?: string) {
  const conditions = excludeId ? and(eq(posts.slug, slug), ne(posts.id, excludeId)) : eq(posts.slug, slug);
  const [existing] = await db.select({ id: posts.id }).from(posts).where(conditions).limit(1);
  return Boolean(existing);
}
