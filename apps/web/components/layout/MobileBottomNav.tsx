"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, BookOpen, BarChart3, Newspaper } from "lucide-react";

const TABS = [
  { href: "/play", label: "Play", icon: Gamepad2, match: "/play" },
  { href: "/dictionary", label: "Dictionary", icon: BookOpen, match: "/dictionary" },
  { href: "/dashboard", label: "Stats", icon: BarChart3, match: "/dashboard" },
  { href: "/blog", label: "Blog", icon: Newspaper, match: "/blog" },
];

/** Fixed, glassmorphic — mobile-only (blueprint UI spec: fast phone usage for the four core sections). */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/80 bg-white/75 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-neutral-800/80 dark:bg-neutral-950/75"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = pathname?.startsWith(match);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                active ? "text-der" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
