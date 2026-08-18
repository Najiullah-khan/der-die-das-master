"use client";

import { useOAuthSignIn } from "@/lib/auth/useOAuthSignIn";

/**
 * "Save your progress" prompt (blueprint §5 step 2) — shown to guests after a completed
 * session rather than gating play behind a forced login.
 */
export function SignInPrompt() {
  const { pending, error, signInWith } = useOAuthSignIn();

  return (
    <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 p-4 text-center dark:border-neutral-800">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">Save your progress?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void signInWith("google")}
          disabled={pending !== null}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => void signInWith("github")}
          disabled={pending !== null}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {pending === "github" ? "Redirecting…" : "Continue with GitHub"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
