import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { CefrLevel } from "@ddd/shared";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllLevelProgress, maxBatchForLevel } from "@/lib/db/queries/user-progress";
import { buildMetadata } from "@/lib/seo/metadata";
import { PlayClient } from "./PlayClient";

const VALID_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const upper = level.toUpperCase();
  if (!VALID_LEVELS.includes(upper as CefrLevel)) return {};

  return buildMetadata({
    title: `Practice ${upper} German Nouns – Der-Die-Das Master`,
    description: `Practice der, die, and das with ${upper}-level German nouns — a fast, gamified session with instant feedback.`,
    path: `/play/${upper}`,
  });
}

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ batch?: string }>;
}) {
  const { level } = await params;
  const upper = level.toUpperCase();
  if (!VALID_LEVELS.includes(upper as CefrLevel)) notFound();
  const cefrLevel = upper as CefrLevel;

  // Explicit batch override (e.g. the /play Resume CTA links to `/play/A1?batch=2`) — validated
  // here just enough to know it's a plausible batch number; PlayClient clamps it to the user's
  // actual unlocked range (batch auto-advance fix) since that requires their progress, fetched below.
  const { batch: rawBatch } = await searchParams;
  const parsedBatch = rawBatch ? Number.parseInt(rawBatch, 10) : NaN;
  const requestedBatch = Number.isInteger(parsedBatch) && parsedBatch >= 1 ? parsedBatch : null;

  // null (rather than an empty array) is the guest signal PlayClient uses to read
  // localStorage-based progress instead (batch progression & level unlocking upgrade).
  const user = await getCurrentUser(await headers());
  const [initialLevelProgress, totalBatches] = await Promise.all([
    user ? getAllLevelProgress(user.id) : Promise.resolve(null),
    maxBatchForLevel(cefrLevel),
  ]);

  // key={upper}: forces a fresh PlayClient instance on every level change (nav link, batch
  // drawer redirect, placement-challenge unlock redirect) rather than reusing one across
  // client-side navigations — resets all local session/progress state for free instead of
  // needing effects that re-run on prop changes.
  return (
    <PlayClient
      key={upper}
      level={cefrLevel}
      initialLevelProgress={initialLevelProgress}
      totalBatches={totalBatches}
      requestedBatch={requestedBatch}
    />
  );
}
