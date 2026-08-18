import { lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rateLimitBuckets } from "@/lib/db/schema";

const WINDOW_MS = 60_000;
// Cheap, unconditional per-call cleanup would double the query count of every rate-limited
// route; doing it probabilistically keeps the table bounded without that cost.
const CLEANUP_PROBABILITY = 0.02;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** Fixed 60s-window counter, keyed by `${scope}:${identifier}`. See schema.ts for the "why DB, not memory". */
export async function checkRateLimit(scope: string, identifier: string, limit: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const key = `${scope}:${identifier}:${windowStart}`;
  const expiresAt = new Date(windowStart + WINDOW_MS);

  if (Math.random() < CLEANUP_PROBABILITY) {
    await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.expiresAt, new Date(now)));
  }

  const [row] = await db
    .insert(rateLimitBuckets)
    .values({ key, count: 1, expiresAt })
    .onConflictDoUpdate({ target: rateLimitBuckets.key, set: { count: sql`${rateLimitBuckets.count} + 1` } })
    .returning({ count: rateLimitBuckets.count });

  return { allowed: row.count <= limit, remaining: Math.max(0, limit - row.count) };
}

/** Best-effort client identifier — Cloudflare sets `cf-connecting-ip` in production; falls back for local dev. */
export function getClientIp(headers: Headers): string {
  return headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function rateLimitResponse(): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "60" },
  });
}
