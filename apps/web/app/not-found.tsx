import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found – Der-Die-Das Master", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-6xl font-bold tracking-tight">
        <span className="text-der">4</span>
        <span className="text-die">0</span>
        <span className="text-das">4</span>
      </h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-300">
        We couldn&apos;t find that page — it may have been moved or never existed.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-der-strong px-6 py-3 font-medium text-white hover:bg-der"
        >
          Go home
        </Link>
        <Link
          href="/dictionary"
          className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Browse the dictionary
        </Link>
      </div>
    </main>
  );
}
