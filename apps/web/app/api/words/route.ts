import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getWordBatch } from "@/lib/db/queries/words";
import { BATCH_SIZE } from "@/lib/game-engine/levels";

const querySchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  // Which numbered 10-word batch to fetch (1-indexed). Omit for the pre-batch-progression
  // behavior: a plain top-N fetch from the start of the level — still used for the service
  // worker's full-level offline precache (blueprint §9 PWA), which has no notion of batches.
  batch: z.coerce.number().int().min(1).optional(),
  // Upper bound covers a full-level fetch as well as normal small session batches.
  count: z.coerce.number().int().min(1).max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  const { level, batch } = parsed.data;
  const count = parsed.data.count ?? (batch ? BATCH_SIZE : 15);
  const offset = batch ? (batch - 1) * BATCH_SIZE : 0;

  const words = await getWordBatch(level, count, offset);
  return NextResponse.json({ words });
}
