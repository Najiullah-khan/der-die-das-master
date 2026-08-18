import Link from "next/link";
import { Lock, Crown, Clock } from "lucide-react";
import type { CefrLevel } from "@ddd/shared";

export type LevelBadgeStatus = "locked" | "unlocked" | "completed" | "coming-soon";

interface LevelBadgeProps {
  level: CefrLevel;
  status: LevelBadgeStatus;
  /** 0-100, ignored for "locked"/"coming-soon". */
  percent: number;
  href: string;
  /** Last-played level (resume-state upgrade) gets an extra outline so it stands out in the grid. */
  highlighted?: boolean;
}

// Visual CEFR level badges (blueprint UI spec): A1 green/starter, A2 blue/intermediate,
// B1 purple/advanced, B2-C2 gold/master.
const LEVEL_STYLES: Record<CefrLevel, { tier: string; text: string; ring: string; bar: string }> = {
  A1: { tier: "Starter", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500", bar: "bg-emerald-500" },
  A2: { tier: "Intermediate", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500", bar: "bg-blue-500" },
  B1: { tier: "Advanced", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500", bar: "bg-purple-500" },
  B2: { tier: "Master", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500", bar: "bg-amber-500" },
  C1: { tier: "Master", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500", bar: "bg-amber-500" },
  C2: { tier: "Master", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500", bar: "bg-amber-500" },
};

export function LevelBadge({ level, status, percent, href, highlighted }: LevelBadgeProps) {
  const styles = LEVEL_STYLES[level];
  const locked = status === "locked";
  const comingSoon = status === "coming-soon";

  const badgeCircle = (
    <span
      className={`relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-black ${styles.text} ${
        !locked && !comingSoon && status === "unlocked" ? "animate-level-glow" : ""
      } ${status === "completed" ? `ring-2 ${styles.ring}` : "ring-1 ring-neutral-200 dark:ring-neutral-700"}`}
      style={{ backgroundColor: "color-mix(in oklch, currentColor 12%, transparent)" }}
    >
      {level}
      {status === "completed" && (
        <Crown
          className={`absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-white p-0.5 ${styles.text} dark:bg-neutral-900`}
          aria-hidden
        />
      )}
      {locked && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
          <Lock className="h-3 w-3 text-neutral-500" aria-hidden />
        </span>
      )}
      {comingSoon && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
          <Clock className="h-3 w-3 text-neutral-500" aria-hidden />
        </span>
      )}
    </span>
  );

  const labelBlock = (
    <div>
      <div className="font-semibold">{level}</div>
      <div className="text-xs text-neutral-500">{styles.tier}</div>
    </div>
  );

  const statusPill = comingSoon ? (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800">
      {level} · Coming Soon ⏳
    </span>
  ) : locked ? (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800">
      Pass Test to Unlock
    </span>
  ) : status === "completed" ? (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${styles.text}`}>Completed</span>
  ) : (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div className={`h-full rounded-full ${styles.bar} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">{percent}%</div>
    </div>
  );

  // Coming Soon levels have no seeded vocabulary at all (level-availability upgrade) — rendered
  // as an inert block rather than a Link so there's no way to click or keyboard-activate into a
  // placement challenge for a level that can't actually be played yet.
  if (comingSoon) {
    return (
      <div
        aria-label={`${level} — ${styles.tier}, coming soon`}
        aria-disabled="true"
        className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-neutral-200 p-5 text-center opacity-50 grayscale dark:border-neutral-800"
      >
        {badgeCircle}
        {labelBlock}
        {statusPill}
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`${level} — ${styles.tier}, ${locked ? "locked" : status === "completed" ? "completed" : `${percent}% complete`}`}
      className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        locked
          ? "border-neutral-200 opacity-60 grayscale dark:border-neutral-800"
          : "border-neutral-200 dark:border-neutral-800"
      } ${highlighted ? "ring-2 ring-der ring-offset-2 dark:ring-offset-neutral-950" : ""}`}
    >
      {badgeCircle}
      {labelBlock}
      {statusPill}
    </Link>
  );
}
