import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { gameSessions } from "@/lib/db/schema";
import { getWordBatch } from "@/lib/db/queries/words";
import { getCurrentUser } from "@/lib/auth/session";

const bodySchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  wordCount: z.number().int().min(1).max(50).default(15),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { level, wordCount } = parsed.data;

  // Auth is optional — guests play immediately (blueprint §5); the session row is still
  // recorded (userId null) for aggregate analytics, but per-user stats only apply when authed.
  const user = await getCurrentUser(request.headers);

  const batch = await getWordBatch(level, wordCount);
  if (batch.length === 0) {
    return NextResponse.json({ error: `No words available for level ${level}` }, { status: 404 });
  }

  const sessionId = crypto.randomUUID();
  const startedAt = new Date();

  await db.insert(gameSessions).values({
    id: sessionId,
    userId: user?.id ?? null,
    cefrLevel: level,
    wordCount: batch.length,
    score: 0,
    perfectBatch: false,
    startedAt,
    completedAt: null,
  });

  return NextResponse.json({ sessionId, words: batch });
}
