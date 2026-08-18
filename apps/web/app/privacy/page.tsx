import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Der-Die-Das Master",
  description: "What data Der-Die-Das Master collects, why, and how to export or delete it.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "2026-08-05";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated {LAST_UPDATED}.</p>

      <p className="mt-6 text-sm text-amber-700 dark:text-amber-400">
        This is a plain-language description of what this app actually does with your data, written
        to be accurate rather than to look like boilerplate — but it is not a substitute for review
        by a qualified privacy lawyer before a real launch.
      </p>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">You can play without an account</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Guest progress (scores, streaks, word mastery) is stored only in your browser's local
          storage, never sent to our servers, and never leaves your device unless you sign in.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">What we collect if you sign in</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
          <li>Email address, and name/profile image if provided by Google or GitHub sign-in.</li>
          <li>Gameplay data: session scores, per-word attempt history, streaks, and achievements.</li>
          <li>Basic technical data needed to keep you signed in (a session cookie) and to apply
            rate limits against abuse (IP address, retained only briefly in a rate-limit counter).</li>
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Why (lawful basis)</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Account and gameplay data is processed to provide the service you're using (contract) —
          tracking your mastery per word is the core feature. Signing in itself is your consent to
          create an account.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Cookies</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Only one: a signed, HTTP-only session cookie set when you sign in, strictly necessary to
          keep you logged in. We don't run analytics or advertising scripts, so there's nothing else
          to consent to.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Who else sees your data</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
          <li>Google or GitHub, only if you choose to sign in with them (they handle that authentication).</li>
          <li>Resend, our transactional email provider, only to deliver magic-link sign-in emails.</li>
          <li>No one else. We don't sell data, and we don't share it with advertisers.</li>
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Your rights</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          From your <a href="/dashboard" className="underline">dashboard</a>, you can export a copy
          of everything we hold about your account as JSON, or permanently delete your account and
          all associated data. Deletion is immediate and cannot be undone.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Data retention</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Account and gameplay data is kept until you delete your account. Rate-limit counters
          expire automatically within minutes.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Children</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          This app isn't directed at children under 13, and we don't knowingly collect data from
          them.
        </p>
      </section>
    </main>
  );
}
