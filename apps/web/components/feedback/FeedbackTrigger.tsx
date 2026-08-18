"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// FeedbackTrigger renders unconditionally in the footer of every page (root layout), so a plain
// static import of FeedbackModal would ship its form/validation code in every page's bundle even
// though almost no visitor ever opens it. ssr:false is valid here (unlike in layout.tsx, a Server
// Component) because this file is itself a Client Component.
const FeedbackModal = dynamic(() => import("@/components/feedback/FeedbackModal").then((m) => m.FeedbackModal), {
  ssr: false,
});

/** Footer/header entry point for the feedback modal — self-contained so layout.tsx stays a server component. */
export function FeedbackTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
      >
        Feedback & Bugs 💬
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
