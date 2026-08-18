"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";

/** Client-safe admin check — fetches a boolean from /api/admin/me rather than shipping ADMIN_EMAIL to the bundle. */
export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const [result, setResult] = useState<{ userId: string | null; isAdmin: boolean }>({
    userId: null,
    isAdmin: false,
  });

  useEffect(() => {
    if (!userId) return; // no user — the render-time comparison below already reports false
    let cancelled = false;
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data: { isAdmin: boolean }) => {
        if (!cancelled) setResult({ userId, isAdmin: data.isAdmin });
      })
      .catch(() => {
        if (!cancelled) setResult({ userId, isAdmin: false });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Compared during render rather than reset via a synchronous setState-in-effect: if the
  // signed-in user changed (e.g. they signed out) since `result` was last computed, treat as
  // not-admin until the effect above recomputes it for the new userId.
  return result.userId === userId ? result.isAdmin : false;
}
