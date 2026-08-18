"use client";

import { useEffect } from "react";
import { Lock } from "lucide-react";
import type { CefrLevel } from "@ddd/shared";

interface UnlockChallengeModalProps {
  lockedLevel: CefrLevel;
  prerequisiteLevel: CefrLevel;
  onStart: () => void;
  onCancel: () => void;
}

/** Gates a locked level behind a placement challenge (batch progression upgrade). No prior modal convention existed in this codebase — kept deliberately plain (no focus-trap library). */
export function UnlockChallengeModal({ lockedLevel, prerequisiteLevel, onStart, onCancel }: UnlockChallengeModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/50 p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-challenge-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Lock className="h-5 w-5 text-neutral-500" aria-hidden />
        </span>
        <h2 id="unlock-challenge-title" className="mt-4 text-xl font-bold">
          {lockedLevel} is locked
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Pass a round of <span className="font-semibold">{prerequisiteLevel}</span> with at least 80% correct on
          your first try to unlock {lockedLevel}.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onStart}
            className="rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
          >
            Start Challenge
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
