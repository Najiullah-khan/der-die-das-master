"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth/client";

export type OAuthProvider = "google" | "github";

/**
 * Shared `pending`/`error` state machine around `signIn.social` — extracted so
 * `SignInPrompt` and `GuestSaveProgressModal` don't duplicate it. `signIn.social` resolves to
 * `{ data, error }` rather than throwing/redirecting on failure (e.g. PROVIDER_NOT_FOUND when
 * GOOGLE_CLIENT_ID/GITHUB_CLIENT_ID aren't configured), so callers must check `error` explicitly
 * — an unchecked call makes the buttons look unclickable when nothing visible happens.
 */
export function useOAuthSignIn() {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: OAuthProvider) {
    setPending(provider);
    setError(null);

    const { error: signInError } = await signIn.social({ provider, callbackURL: window.location.href });

    if (signInError) {
      setPending(null);
      setError(signInError.message ?? `Couldn't sign in with ${provider === "google" ? "Google" : "GitHub"}.`);
    }
    // On success the page is about to navigate away to the provider's OAuth consent screen,
    // so there's no "else" branch — leaving `pending` set keeps the button disabled until then.
  }

  return { pending, error, signInWith };
}
