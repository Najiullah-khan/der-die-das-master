"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth/client";

/** GDPR self-service actions (blueprint §10) — export is one click; delete requires an explicit confirm step since it's irreversible. */
export function AccountActions() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    const res = await fetch("/api/account/export", { method: "POST" });
    if (!res.ok) {
      setError("Couldn't export your data. Please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "der-die-das-master-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setBusy(false);
      setError("Couldn't delete your account. Please try again.");
      return;
    }
    await signOut();
    window.location.href = "/";
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="font-semibold">Account</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        See our <a href="/privacy" className="underline">privacy policy</a> for what we store.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Export my data
        </button>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Delete my account
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-600">This can&apos;t be undone.</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-full bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-full border border-neutral-300 px-4 py-2 dark:border-neutral-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
