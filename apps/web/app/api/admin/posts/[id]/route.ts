import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { getAdminUser } from "@/lib/auth/admin";
import { getPostById, isSlugTaken } from "@/lib/db/queries/posts";

const bodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
    excerpt: z.string().trim().min(1).max(500),
    contentMarkdown: z.string().trim().min(1),
    category: z.string().trim().min(1).max(60).nullable(),
    metaTitle: z.string().trim().min(1).max(70).nullable(),
    metaDescription: z.string().trim().min(1).max(160).nullable(),
    published: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request.headers);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await getPostById(id);
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.slug && (await isSlugTaken(parsed.data.slug, id))) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  await db
    .update(posts)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(posts.id, id));

  // /blog and /blog/[slug] are ISR (revalidate: 3600) — without this, edits (including
  // publish/unpublish toggles) wouldn't show on the public site for up to an hour. Revalidate
  // both the old and new slug in case the slug itself changed.
  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    revalidatePath(`/blog/${parsed.data.slug}`);
  }
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request.headers);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await getPostById(id);
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await db.delete(posts).where(eq(posts.id, id));

  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
