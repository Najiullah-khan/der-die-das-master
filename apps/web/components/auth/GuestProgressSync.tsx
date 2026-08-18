"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/client";
import { clearGuestProgress, loadGuestProgress } from "@/lib/game-engine/storage";

/**
 * Renders nothing — just watches for the guest-to-signed-in transition (blueprint §5 step 4)
 * and, when it happens, ships any localStorage guest progress to the server to merge into
 * the new account, then clears it locally. Mounted once in the root layout so it fires
 * regardless of which page the user was on when they signed in.
 */
export function GuestProgressSync() {
  const { data: session, isPending } = useSession();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (isPending || !session?.user || attemptedRef.current) return;

    const guestProgress = loadGuestProgress();
    const hasGuestData =
      Object.keys(guestProgress.wordStats).length > 0 ||
      guestProgress.streaks.lastPlayedDate !== null ||
      guestProgress.unlockedLevels.some((level) => level !== "A1") ||
      Object.keys(guestProgress.levelProgress).length > 0;
    if (!hasGuestData) return;

    attemptedRef.current = true;
    fetch("/api/progress/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guestProgress),
    })
      .then((res) => {
        if (res.ok) clearGuestProgress();
        else attemptedRef.current = false; // let it retry on the next render
      })
      .catch(() => {
        attemptedRef.current = false;
      });
  }, [isPending, session]);

  return null;
}
