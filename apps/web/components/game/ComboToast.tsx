"use client";

export function ComboToast({ combo }: { combo: number }) {
  if (combo < 2) return null;

  return (
    <div
      key={combo}
      // bg-amber-700, not the brighter -500: white text on -500 only reached 2.15:1
      // (WCAG needs 4.5:1 at this size/weight) — -700 gets a real 5.05:1.
      className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 animate-combo-pop rounded-full bg-amber-700 px-4 py-1 text-sm font-bold text-white shadow-lg"
      role="status"
    >
      {combo}x combo!
    </div>
  );
}
