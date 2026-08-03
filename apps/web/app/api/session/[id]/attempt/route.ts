import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { gameSessions, sessionAttempts, userWordStats } from "@/lib/db/schema";
import { getWordById } from "@/lib/db/queries/words";
import { pointsForAttempt, calculateMastery } from "@/lib/game-engine/scoring";

const bodySchema = z.object({
  wordId: z.number().int().positive(),
  chosenArticle: z.enum(["der", "die", "das"]),
  attemptNumber: z.number().int().min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { wordId, chosenArticle, attemptNumber } = parsed.data;

  const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.completedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  const word = await getWordById(wordId);
  if (!word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  const correct = chosenArticle === word.article;
  const pointsAwarded = correct ? pointsForAttempt(attemptNumber) : 0;
  const now = new Date();

  await db.insert(sessionAttempts).values({
    sessionId,
    wordId,
    attemptNumber,
    chosenArticle,
    correct,
    pointsAwarded,
    answeredAt: now,
  });

  // Guest sessions (session.userId null) keep mastery tracking client-side only (blueprint §5).
  let mastery = null;
  if (session.userId) {
    const userId = session.userId;
    const [existing] = await db
      .select()
      .from(userWordStats)
      .where(and(eq(userWordStats.userId, userId), eq(userWordStats.wordId, wordId)))
      .limit(1);

    const attempts = (existing?.attempts ?? 0) + 1;
    const correctCount = (existing?.correct ?? 0) + (correct ? 1 : 0);
    mastery = calculateMastery(attempts, correctCount);

    await db
      .insert(userWordStats)
      .values({
        userId,
        wordId,
        attempts,
        correct: correctCount,
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastPracticedAt: now,
        mastery,
      })
      .onConflictDoUpdate({
        target: [userWordStats.userId, userWordStats.wordId],
        set: { attempts, correct: correctCount, lastPracticedAt: now, mastery },
      });
  }

  return NextResponse.json({ correct, pointsAwarded, mastery });
}
