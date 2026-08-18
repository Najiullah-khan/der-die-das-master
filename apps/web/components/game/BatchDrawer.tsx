"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ListChecks, Lock, PlayCircle, X } from "lucide-react";

interface BatchDrawerProps {
  totalBatches: number;
  highestBatchReached: number;
  selectedBatch: number;
  onSelect: (batch: number) => void;
}

type BatchStatus = "completed" | "active" | "locked";

function statusFor(batch: number, highestBatchReached: number): BatchStatus {
  if (batch < highestBatchReached) return "completed";
  if (batch === highestBatchReached) return "active";
  return "locked";
}

/**
 * Side drawer (desktop) / bottom sheet (mobile) for browsing and quick-switching between a
 * level's batches (batch navigation upgrade) — replaces the old always-visible `BatchJumper`
 * pill row, which only ever appeared after a session ended. Collapsed by default so it doesn't
 * compete with the play screen; opened via a floating trigger.
 */
export function BatchDrawer({ totalBatches, highestBatchReached, selectedBatch, onSelect }: BatchDrawerProps) {
  const [open, setOpen] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const prevHighestRef = useRef(highestBatchReached);

  useEffect(() => {
    if (highestBatchReached > prevHighestRef.current) {
      const newlyReached = highestBatchReached;
      setJustUnlocked(newlyReached);
      prevHighestRef.current = highestBatchReached;
      const timer = setTimeout(() => setJustUnlocked(null), 900);
      return () => clearTimeout(timer);
    }
    prevHighestRef.current = highestBatchReached;
  }, [highestBatchReached]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Nothing to browse yet — mirrors the old BatchJumper's single-batch early return.
  if (totalBatches <= 1) return null;

  function select(batch: number) {
    onSelect(batch);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Browse batches"
        className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-1.5 rounded-l-full border border-r-0 border-neutral-200 bg-white py-3 pl-3 pr-2.5 text-xs font-medium text-neutral-600 shadow-sm transition-all hover:pr-4 md:flex dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
      >
        <ListChecks className="h-4 w-4" aria-hidden />
        Batches
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Browse batches"
        className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-der text-white shadow-lg transition-transform hover:-translate-y-0.5 md:hidden"
      >
        <ListChecks className="h-5 w-5" aria-hidden />
      </button>

      {/* Backdrop — shared by both the desktop sidebar and mobile sheet, only one is ever visible per breakpoint. */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Desktop sidebar */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a batch"
        className={`fixed inset-y-0 right-0 z-50 hidden w-72 flex-col border-l border-neutral-200 bg-white p-4 shadow-xl transition-transform duration-300 ease-out md:flex dark:border-neutral-800 dark:bg-neutral-950 ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <DrawerHeader onClose={() => setOpen(false)} />
        <BatchList
          totalBatches={totalBatches}
          highestBatchReached={highestBatchReached}
          selectedBatch={selectedBatch}
          justUnlocked={justUnlocked}
          onSelect={select}
        />
      </div>

      {/* Mobile bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a batch"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-neutral-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-xl transition-transform duration-300 ease-out md:hidden dark:border-neutral-800 dark:bg-neutral-950 ${
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <DrawerHeader onClose={() => setOpen(false)} />
        <BatchList
          totalBatches={totalBatches}
          highestBatchReached={highestBatchReached}
          selectedBatch={selectedBatch}
          justUnlocked={justUnlocked}
          onSelect={select}
        />
      </div>
    </>
  );
}

function DrawerHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-semibold">Batches</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function BatchList({
  totalBatches,
  highestBatchReached,
  selectedBatch,
  justUnlocked,
  onSelect,
}: {
  totalBatches: number;
  highestBatchReached: number;
  selectedBatch: number;
  justUnlocked: number | null;
  onSelect: (batch: number) => void;
}) {
  const batches = Array.from({ length: totalBatches }, (_, i) => i + 1);

  return (
    <ul className="flex flex-col gap-1.5 overflow-y-auto">
      {batches.map((batch) => {
        const status = statusFor(batch, highestBatchReached);
        const isSelected = batch === selectedBatch;
        const locked = status === "locked";

        return (
          <li key={batch}>
            <button
              type="button"
              disabled={locked}
              onClick={() => onSelect(batch)}
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                justUnlocked === batch ? "animate-batch-unlock" : ""
              } ${
                locked
                  ? "cursor-not-allowed border-transparent text-neutral-400 dark:text-neutral-600"
                  : isSelected
                    ? "border-der bg-der/10 font-medium text-der"
                    : "border-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
              }`}
            >
              {status === "completed" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />}
              {status === "active" && <PlayCircle className="h-4 w-4 shrink-0 text-der" aria-hidden />}
              {status === "locked" && <Lock className="h-4 w-4 shrink-0" aria-hidden />}
              Batch {batch}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
