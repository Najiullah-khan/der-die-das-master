import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

/**
 * GDPR account deletion (blueprint §10: `/api/account/delete`) — deletes the user row, which
 * cascades (onDelete: "cascade" in schema.ts) to their login sessions, OAuth account links,
 * word stats, streak, achievements, and leaderboard entry. `gameSessions.userId` is
 * onDelete: "set null" by design (schema.ts) rather than cascade: this anonymizes their session
 * history (satisfying erasure — no personal identifier survives) while preserving aggregate
 * play analytics, rather than destroying historical data that's no longer personal data at all.
 */
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser(request.headers);
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit("account:delete", currentUser.id, 3);
  if (!allowed) return rateLimitResponse();

  await db.delete(user).where(eq(user.id, currentUser.id));

  return NextResponse.json({ deleted: true });
}
