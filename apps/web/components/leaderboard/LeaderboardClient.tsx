"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import type { LeaderboardEntry, LeaderboardResponse } from "@ddd/shared";
import { initials } from "@/lib/utils/initials";

type Range = LeaderboardResponse["range"];

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
// Below rank 10, the viewer's own row scrolls out of easy view even within the top-50 list — a
// sticky summary keeps their position visible regardless of where they land in that list.
const STICKY_RANK_THRESHOLD = 10;

interface LeaderboardClientProps {
  initialRange: Range;
  initialEntries: LeaderboardEntry[];
  initialViewer: LeaderboardEntry | null;
  isGuest: boolean;
}

export function LeaderboardClient({ initialRange, initialEntries, initialViewer, isGuest }: LeaderboardClientProps) {
  const [range, setRange] = useState<Range>(initialRange);
  // Seeded with the SSR'd default-range response so the initial tab never refetches — switching
  // tabs fetches on demand and is cached per-range so flipping back and forth stays instant.
  const [cache, setCache] = useState<Partial<Record<Range, LeaderboardResponse>>>({
    [initialRange]: { range: initialRange, entries: initialEntries, viewer: initialViewer },
  });
  const [loading, setLoading] = useState(false);

  const current = cache[range];

  async function switchTo(next: Range) {
    setRange(next);
    if (cache[next]) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?range=${next}`);
      if (!res.ok) throw new Error("Failed to load leaderboard");
      const data: LeaderboardResponse = await res.json();
      setCache((prev) => ({ ...prev, [next]: data }));
    } catch {
      setCache((prev) => ({ ...prev, [next]: { range: next, entries: [], viewer: null } }));
    } finally {
      setLoading(false);
    }
  }

  const entries = current?.entries ?? [];
  const viewer = current?.viewer ?? null;
  // Covers both "ranked 11-50, visible in the list but easy to scroll past" and "ranked beyond
  // 50, not rendered in the list at all" — either way the sticky bar is what makes it findable.
  const showStickyPosition = viewer !== null && viewer.rank > STICKY_RANK_THRESHOLD;

  return (
    <div>
      {isGuest && (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-linear-to-r from-der/10 to-das/10 p-4 text-center dark:border-neutral-800">
          <p className="text-sm font-medium">Sign in to join the leaderboard and sync your progress!</p>
          <Link
            href="/play"
            className="rounded-full bg-der px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
          >
            Start playing
          </Link>
        </div>
      )}

      <div role="group" aria-label="Leaderboard range" className="mt-6 flex gap-2">
        <TabButton active={range === "weekly"} onClick={() => switchTo("weekly")}>
          This Week
        </TabButton>
        <TabButton active={range === "alltime"} onClick={() => switchTo("alltime")}>
          All-time
        </TabButton>
      </div>

      {loading && !current ? (
        <p role="status" className="mt-8 text-center text-sm text-neutral-500">
          Loading…
        </p>
      ) : entries.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 py-10 text-center dark:border-neutral-800">
          <p className="text-sm text-neutral-500">
            {range === "weekly"
              ? "No scores yet this week — be the first to play a session!"
              : "No scores yet — be the first to play a session!"}
          </p>
          <Link
            href="/play"
            className="rounded-full bg-der px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
          >
            Play now
          </Link>
        </div>
      ) : (
        <>
          <ol className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800">
            {entries.map((entry) => (
              <LeaderboardRowItem key={entry.userId} entry={entry} isViewer={viewer?.userId === entry.userId} />
            ))}
          </ol>
          {!isGuest && !viewer && (
            <p className="mt-4 text-center text-xs text-neutral-500">
              You haven&apos;t scored {range === "weekly" ? "this week" : "yet"} — play a session to appear here!
            </p>
          )}
        </>
      )}

      {showStickyPosition && viewer && (
        <div className="fixed inset-x-0 bottom-20 z-20 flex justify-center px-6 md:bottom-6">
          <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white/95 px-5 py-2.5 shadow-lg backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-der to-das text-xs font-bold text-white">
              {initials(viewer.displayName, null)}
            </span>
            <span className="text-sm font-medium">
              Your Position: <span className="text-der">#{viewer.rank}</span>
            </span>
            <span className="text-sm text-neutral-500">{viewer.score.toLocaleString()} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-der text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function LeaderboardRowItem({ entry, isViewer }: { entry: LeaderboardEntry; isViewer: boolean }) {
  const medal = MEDALS[entry.rank];

  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-2 py-3 transition-colors ${
        isViewer ? "bg-der/10 ring-1 ring-der" : ""
      }`}
    >
      <span className="w-8 shrink-0 text-center font-mono text-sm text-neutral-500 dark:text-neutral-400">
        {medal ?? `#${entry.rank}`}
      </span>
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-der to-das text-xs font-bold text-white"
      >
        {initials(entry.displayName, null)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {entry.displayName}
          {isViewer && <span className="ml-1.5 text-xs font-normal text-der">(you)</span>}
        </span>
        {entry.wordsMastered !== null && (
          <span className="block text-xs text-neutral-500 dark:text-neutral-400">{entry.wordsMastered} mastered</span>
        )}
      </span>
      {entry.currentDailyStreak > 0 && (
        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          <Flame className="h-3 w-3" aria-hidden />
          {entry.currentDailyStreak}
        </span>
      )}
      <span className="shrink-0 font-semibold">{entry.score.toLocaleString()}</span>
    </li>
  );
}
