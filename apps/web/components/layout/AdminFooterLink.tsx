"use client";

import { useIsAdmin } from "@/lib/auth/useIsAdmin";

/** Renders nothing unless the signed-in user is the admin (blog UI spec: "Discreet Admin Access" — no prominent public link). */
export function AdminFooterLink() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;

  return (
    <a
      href="/admin"
      className="text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
    >
      Admin
    </a>
  );
}
