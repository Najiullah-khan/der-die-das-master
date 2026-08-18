import { NextResponse, type NextRequest } from "next/server";
import type { CodexEntry } from "@ddd/shared";
import { getWordBySlug } from "@/lib/db/queries/words";
import { getUserWordStat } from "@/lib/db/queries/stats";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const word = await getWordBySlug(slug);
  if (!word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  const user = await getCurrentUser(request.headers);
  const stat = user ? await getUserWordStat(user.id, word.id) : null;

  const entry: CodexEntry = {
    ...word,
    stats: stat ? { attempts: stat.attempts, correct: stat.correct, mastery: stat.mastery } : null,
  };

  return NextResponse.json(entry);
}
