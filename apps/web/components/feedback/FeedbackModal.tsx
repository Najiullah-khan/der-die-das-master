"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { FeedbackType } from "@ddd/shared";
import { useSession } from "@/lib/auth/client";

interface FeedbackModalProps {
  onClose: () => void;
}

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug Report 🐛" },
  { value: "feature", label: "Feature Request 💡" },
  { value: "general", label: "General 💬" },
];

/** Same dialog/backdrop/Escape-to-close pattern as UnlockChallengeModal. */
export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { data: session } = useSession();
  const isGuest = !session?.user;

  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        message: message.trim(),
        email: isGuest && email.trim() ? email.trim() : undefined,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't send feedback. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-3xl" aria-hidden>
              ✅
            </span>
            <h2 className="text-xl font-bold">Thanks for the feedback!</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              We read every submission — appreciate you taking the time.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="feedback-modal-title" className="text-xl font-bold">
                Feedback & Bugs
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div role="radiogroup" aria-label="Feedback type" className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  role="radio"
                  aria-checked={type === opt.value}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors sm:text-sm ${
                    type === opt.value
                      ? "border-der bg-der/10 text-der"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                maxLength={2000}
                placeholder="What's on your mind?"
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-der focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            {isGuest && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">
                  Email <span className="font-normal text-neutral-500">(optional — so we can follow up)</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-der focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
