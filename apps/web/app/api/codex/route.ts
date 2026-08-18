import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { CodexEntry, CodexSearchResponse } from "@ddd/shared";
import { searchWords } from "@/lib/db/queries/words";
import { getCurrentUser } from "@/lib/auth/session";

const MASTERY_FILTER_VALUES = ["never_seen", "discovered", "struggled", "any"] as const;

const querySchema = z.object({
  search: z.string().max(100).optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  mastery: z.enum(MASTERY_FILTER_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  const { search, level, mastery, limit, offset } = parsed.data;

  const user = await getCurrentUser(request.headers);

  const { rows, total } = await searchWords({ search, level, masteryFilter: mastery, userId: user?.id, limit, offset });

  const entries: CodexEntry[] = rows.map(({ word, stats }) => ({
    ...word,
    stats: stats ? { attempts: stats.attempts, correct: stats.correct, mastery: stats.mastery } : null,
  }));

  const body: CodexSearchResponse = { entries, total, limit, offset };
  return NextResponse.json(body);
}
