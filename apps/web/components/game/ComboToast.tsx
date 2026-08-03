"use client";

export function ComboToast({ combo }: { combo: number }) {
  if (combo < 2) return null;

  return (
    <div
      key={combo}
      className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 animate-combo-pop rounded-full bg-amber-500 px-4 py-1 text-sm font-bold text-white shadow-lg"
      role="status"
    >
      {combo}x combo!
    </div>
  );
}
