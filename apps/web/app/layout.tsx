import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GuestProgressSync } from "@/components/auth/GuestProgressSync";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AdminFooterLink } from "@/components/layout/AdminFooterLink";
import { FeedbackTrigger } from "@/components/feedback/FeedbackTrigger";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  // No title.template here: every page in this app already includes the full "– Der-Die-Das
  // Master" suffix in its own title string (an established, pre-existing convention across the
  // whole app) — a parent template would wrap those *again* into a doubled
  // "X – Der-Die-Das Master | Der-Die-Das Master" (caught by hitting /play in a real production
  // build and finding exactly that in the rendered <title>).
  ...buildMetadata({
    title: "Der-Die-Das Master",
    description: "Learn German noun genders (der, die, das) through a fast, gamified practice loop.",
    path: "/",
  }),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GuestProgressSync />
        <ServiceWorkerRegistration />
        <Navbar />
        {/* pb-16: clearance for MobileBottomNav (fixed, mobile-only) so it never occludes content
            or the footer below it — applied to this wrapper rather than split across children
            and footer individually, since either one can end up as the last thing on screen. */}
        <div className="flex flex-1 flex-col pb-16 md:pb-0">
          {children}
          <footer className="flex flex-wrap justify-center gap-4 border-t border-neutral-200 px-6 py-6 text-center text-xs dark:border-neutral-800">
            {/* text-neutral-600/300, not the lighter -400/-500 shades used elsewhere for
                secondary text — -400 measures 2.59:1 against white, well under WCAG's 4.5:1 for
                this size text, and these are real functional links, not decoration. */}
            <a
              href="/attributions"
              className="text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              Data sources & attributions
            </a>
            <a
              href="/privacy"
              className="text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              Privacy policy
            </a>
            <FeedbackTrigger />
            <AdminFooterLink />
          </footer>
        </div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
