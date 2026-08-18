"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { useSession, signOut } from "@/lib/auth/client";
import { useIsAdmin } from "@/lib/auth/useIsAdmin";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { initials } from "@/lib/utils/initials";

export function AccountMenu() {
  const { data: session, isPending } = useSession();
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSignIn(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isPending) {
    return <div className="h-9 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" aria-hidden />;
  }

  const user = session?.user;

  if (!user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowSignIn((v) => !v)}
          className="rounded-full bg-linear-to-r from-der to-die px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          Sign in
        </button>
        {showSignIn && (
          <div className="absolute right-0 z-20 mt-2 w-72">
            <SignInPrompt />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-neutral-200 py-1 pl-1 pr-3 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-der to-das text-xs font-bold text-white">
          {initials(user.name, user.email)}
        </span>
        <span className="max-w-32 truncate text-sm font-medium">{user.name || user.email}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 py-1.5 shadow-lg backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Admin
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
