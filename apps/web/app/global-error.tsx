"use client";

import { useEffect } from "react";

// Client-render errors escaping to the root (server-side errors are already covered by
// instrumentation.ts's onRequestError — see lib/monitoring/report-error.ts). Kept to
// console.error rather than reportError(): that module reads SENTRY_DSN without a NEXT_PUBLIC_
// prefix, so it's always undefined in client bundles by design (Next only inlines
// NEXT_PUBLIC_-prefixed vars client-side) — piping this through Sentry too would need a second,
// client-safe reporter, which isn't worth it for the rarer case (server errors are the ones
// most likely to actually happen here: DB/auth/query failures).
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-neutral-600">An unexpected error occurred. You can try again.</p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
