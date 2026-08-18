import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { getAdminUser } from "@/lib/auth/admin";
import { getAllPostsForAdmin, isSlugTaken } from "@/lib/db/queries/posts";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  excerpt: z.string().trim().min(1).max(500),
  contentMarkdown: z.string().trim().min(1),
  published: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request.headers);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await getAllPostsForAdmin();
  return NextResponse.json({ posts: rows });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request.headers);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { title, slug, excerpt, contentMarkdown, published } = parsed.data;

  if (await isSlugTaken(slug)) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(posts).values({
    id,
    slug,
    title,
    excerpt,
    contentMarkdown,
    published,
    createdAt: now,
    updatedAt: now,
  });

  // /blog and /blog/[slug] are ISR (revalidate: 3600) — without this, a newly published post
  // wouldn't appear on the public site for up to an hour after saving.
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ id }, { status: 201 });
}
