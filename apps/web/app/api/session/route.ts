import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { gameSessions } from "@/lib/db/schema";
import { getWordBatch } from "@/lib/db/queries/words";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { BATCH_SIZE, getPrerequisiteLevel, isPlayableLevel } from "@/lib/game-engine/levels";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const bodySchema = z.object({
  level: z.enum(CEFR_LEVELS),
  batch: z.number().int().min(1).default(1),
  // Set only when this session is a placement challenge — `level` must be its immediate
  // prerequisite (checked below; a client bug or tampered request can't target arbitrary levels).
  placementForLevel: z.enum(CEFR_LEVELS).optional(),
});

export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit("session:start", getClientIp(request.headers), 30);
  if (!allowed) return rateLimitResponse();

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { level, batch, placementForLevel } = parsed.data;

  // Coming Soon levels (level-availability upgrade) have no seeded vocabulary — reject both
  // playing them directly and any placement challenge that would unlock one, rather than relying
  // on the incidental 404 an empty word batch would otherwise produce below.
  if (!isPlayableLevel(level)) {
    return NextResponse.json({ error: `${level} isn't available to play yet` }, { status: 400 });
  }
  if (placementForLevel && !isPlayableLevel(placementForLevel)) {
    return NextResponse.json({ error: `${placementForLevel} isn't available to play yet` }, { status: 400 });
  }

  if (placementForLevel && getPrerequisiteLevel(placementForLevel) !== level) {
    return NextResponse.json({ error: `${level} is not the prerequisite for ${placementForLevel}` }, { status: 400 });
  }

  // Auth is optional — guests play immediately (blueprint §5); the session row is still
  // recorded (userId null) for aggregate analytics, but per-user stats only apply when authed.
  const user = await getCurrentUser(request.headers);

  const offset = (batch - 1) * BATCH_SIZE;
  const words = await getWordBatch(level, BATCH_SIZE, offset);
  if (words.length === 0) {
    return NextResponse.json({ error: `No words available for level ${level}, batch ${batch}` }, { status: 404 });
  }

  const sessionId = crypto.randomUUID();
  const startedAt = new Date();

  await db.insert(gameSessions).values({
    id: sessionId,
    userId: user?.id ?? null,
    cefrLevel: level,
    wordCount: words.length,
    batch,
    placementForLevel: placementForLevel ?? null,
    score: 0,
    perfectBatch: false,
    startedAt,
    completedAt: null,
  });

  return NextResponse.json({ sessionId, words });
}
