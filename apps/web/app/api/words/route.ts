import { NextResponse, type NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { words } from "@/lib/db/schema";

const querySchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  count: z.coerce.number().int().min(1).max(50).default(15),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  const { level, count } = parsed.data;

  // Simple frequency-ordered batch for now; weighted "no word left behind" selection
  // (favoring the user's weak words) is Phase 2 game-engine work.
  const batch = await db
    .select()
    .from(words)
    .where(eq(words.cefrLevel, level))
    .orderBy(asc(words.frequencyRank))
    .limit(count);

  return NextResponse.json({ words: batch });
}
