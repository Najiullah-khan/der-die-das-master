"use client";

import { useEffect } from "react";
import { PartyPopper } from "lucide-react";
import { useOAuthSignIn } from "@/lib/auth/useOAuthSignIn";
import { markSaveProgressPromptSeen } from "@/lib/game-engine/storage";

interface GuestSaveProgressModalProps {
  onDismiss: () => void;
}

/**
 * High-converting, one-time "save your progress" modal shown to guests right after they finish
 * Batch 1 of A1 (guest onboarding upgrade) — same dialog/backdrop/Escape-to-close pattern as
 * `UnlockChallengeModal`. Distinct from the small inline `SignInPrompt` nudge shown after every
 * other guest session completion.
 */
export function GuestSaveProgressModal({ onDismiss }: GuestSaveProgressModalProps) {
  const { pending, error, signInWith } = useOAuthSignIn();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    markSaveProgressPromptSeen();
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-6 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-progress-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-der/15 via-die/15 to-das/15 text-der">
          <PartyPopper className="h-6 w-6" aria-hidden />
        </span>
        <h2 id="save-progress-title" className="mt-4 text-xl font-bold">
          Great start!
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Sign in to save your stats, keep your streak alive, and sync across devices.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void signInWith("github")}
            disabled={pending !== null}
            className="rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === "github" ? "Redirecting…" : "Continue with GitHub"}
          </button>
          <button
            type="button"
            onClick={() => void signInWith("google")}
            disabled={pending !== null}
            className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {pending === "google" ? "Redirecting…" : "Continue with Google"}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          Guest progress lives only in this browser&apos;s local storage — signing in protects your streak and
          unlocked levels from being lost.
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="mt-4 text-xs text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Continue as Guest (Progress saved locally on this device only)
        </button>
      </div>
    </div>
  );
}
