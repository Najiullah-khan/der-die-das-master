"use client";

import { useEffect } from "react";

// Route-segment error boundary — catches errors anywhere in the app tree without tearing down
// the root layout (Navbar/footer stay visible), unlike global-error.tsx which only fires for
// errors escaping the root layout itself. See global-error.tsx for why this logs via
// console.error rather than reportError(): SENTRY_DSN is deliberately not NEXT_PUBLIC_-prefixed,
// so it's unavailable in this client component by design — server errors are already covered by
// instrumentation.ts's onRequestError.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-full bg-der-strong px-6 py-3 font-medium text-white hover:bg-der"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
