import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getLeaderboardView } from "@/lib/db/queries/leaderboard";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Leaderboard – Der-Die-Das Master",
  description: "See who's mastering German noun genders fastest — weekly and all-time rankings.",
  path: "/leaderboard",
});

// Personalized (viewer highlighting/rank) — never cached across visitors, same as /dashboard.
export const dynamic = "force-dynamic";

const DEFAULT_RANGE = "alltime" as const;

export default async function LeaderboardPage() {
  const user = await getCurrentUser(await headers());
  const { entries, viewer } = await getLeaderboardView(DEFAULT_RANGE, user?.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 pb-24">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Top learners by total score — weekly and all-time.
      </p>

      <LeaderboardClient
        initialRange={DEFAULT_RANGE}
        initialEntries={entries.map((r) => ({
          rank: r.rank,
          userId: r.userId,
          displayName: r.displayName,
          score: r.score,
          wordsMastered: r.wordsMastered,
          currentDailyStreak: r.currentDailyStreak,
        }))}
        initialViewer={
          viewer
            ? {
                rank: viewer.rank,
                userId: viewer.userId,
                displayName: viewer.displayName,
                score: viewer.score,
                wordsMastered: viewer.wordsMastered,
                currentDailyStreak: viewer.currentDailyStreak,
              }
            : null
        }
        isGuest={!user}
      />
    </main>
  );
}
