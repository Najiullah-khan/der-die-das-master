import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllLevelProgress, getLastPlayedLevel } from "@/lib/db/queries/user-progress";
import { countWordsByLevel, getMaxCompletedBatchByLevel } from "@/lib/db/queries/gamification-stats";
import { LevelSelectGrid } from "@/components/game/LevelSelectGrid";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Play – Der-Die-Das Master",
  description: "Choose a CEFR level (A1–C2) and start practicing German noun genders — der, die, or das.",
  path: "/play",
});

// Progress is per-user (or guest-local); never cache across visitors (mirrors /dashboard).
export const dynamic = "force-dynamic";

export default async function PlaySelectPage() {
  const user = await getCurrentUser(await headers());

  const [totalWordsByLevel, levelProgress, lastPlayedLevel, completedBatchesByLevel] = await Promise.all([
    countWordsByLevel(),
    user ? getAllLevelProgress(user.id) : Promise.resolve(null),
    user ? getLastPlayedLevel(user.id) : Promise.resolve(null),
    user ? getMaxCompletedBatchByLevel(user.id) : Promise.resolve({}),
  ]);

  return (
    <LevelSelectGrid
      initialLevelProgress={levelProgress}
      initialLastPlayedLevel={lastPlayedLevel}
      completedBatchesByLevel={completedBatchesByLevel}
      totalWordsByLevel={totalWordsByLevel}
    />
  );
}
