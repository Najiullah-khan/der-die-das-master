import { headers } from "next/headers";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { Flame, Trophy, Target, BookMarked } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { streaks } from "@/lib/db/schema";
import { initialStreakState } from "@/lib/game-engine/streaks";
import { ACHIEVEMENTS } from "@/lib/game-engine/achievements";
import { getUnlockedAchievements } from "@/lib/db/queries/achievements";
import { getTodayMission } from "@/lib/db/queries/missions";
import { countWordsMastered, getUserAccuracy, getUserTotalScore } from "@/lib/db/queries/gamification-stats";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { AccountActions } from "@/components/auth/AccountActions";

// Private, per-user data (blueprint §1: "No SEO value") — noindex, same treatment as /admin/*.
export const metadata: Metadata = { title: "Dashboard – Der-Die-Das Master", robots: { index: false, follow: false } };

// No SEO value, always fresh per-user data (blueprint §1: "/dashboard, /profile: CSR, authenticated").
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser(await headers());

  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in to see your dashboard</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Track your streak, achievements, and daily mission once you have an account.
        </p>
        <SignInPrompt />
      </main>
    );
  }

  const [streakRow, unlockedAchievements, mission, wordsMastered, totalScore, accuracy] = await Promise.all([
    db.select().from(streaks).where(eq(streaks.userId, user.id)).limit(1).then((r) => r[0] ?? null),
    getUnlockedAchievements(user.id),
    getTodayMission(user.id),
    countWordsMastered(user.id),
    getUserTotalScore(user.id),
    getUserAccuracy(user.id),
  ]);

  const streak = streakRow ?? { ...initialStreakState(), currentDailyStreak: 0, highestDailyStreak: 0 };
  const unlockedMap = new Map(unlockedAchievements.map((a) => [a.achievementId, a.unlockedAt]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Welcome back{user.name ? `, ${user.name}` : ""}</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Flame} label="Daily streak" value={String(streak.currentDailyStreak)} accent="text-die" />
        <StatCard icon={Trophy} label="Best streak" value={String(streak.highestDailyStreak)} accent="text-der" />
        <StatCard
          icon={Target}
          label="Accuracy"
          value={accuracy === null ? "—" : `${accuracy}%`}
          accent="text-das"
        />
        <StatCard icon={BookMarked} label="Words mastered" value={String(wordsMastered)} accent="text-der" />
      </div>

      <p className="mt-3 text-center text-xs text-neutral-500 sm:text-left">
        Total score: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{totalScore.toLocaleString()}</span>
      </p>

      <section className="mt-8 rounded-2xl border border-neutral-200 p-5 shadow-sm dark:border-neutral-800">
        <h2 className="font-semibold">Today's mission</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {mission.label} — {mission.progress}/{mission.goal} {mission.complete && "✅"}
        </p>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
          role="progressbar"
          aria-valuenow={mission.progress}
          aria-valuemin={0}
          aria-valuemax={mission.goal}
        >
          <div
            className="h-full bg-linear-to-r from-der to-das transition-all"
            style={{ width: `${Math.min(100, (mission.progress / mission.goal) * 100)}%` }}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Achievements</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const unlockedAt = unlockedMap.get(a.id);
            return (
              <li
                key={a.id}
                title={a.description}
                aria-label={`${a.title}: ${unlockedAt ? "unlocked" : "locked"} — ${a.description}`}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center shadow-sm transition-all ${
                  unlockedAt
                    ? "border-neutral-200 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800"
                    : "border-neutral-100 opacity-40 dark:border-neutral-900"
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {a.icon}
                </span>
                <span className="text-xs font-medium">{a.title}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <a href="/leaderboard" className="mt-8 inline-block text-sm text-neutral-500 underline hover:text-neutral-700">
        View leaderboard
      </a>

      <AccountActions />
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800">
      <Icon className={`h-5 w-5 ${accent}`} aria-hidden />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}
