import { headers } from "next/headers";
import type { Metadata } from "next";
import type { FeedbackType } from "@ddd/shared";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminUser } from "@/lib/auth/admin";
import { getAllFeedbackForAdmin } from "@/lib/db/queries/feedback";
import { SignInPrompt } from "@/components/auth/SignInPrompt";

export const metadata: Metadata = { title: "Feedback – Der-Die-Das Master", robots: { index: false, follow: false } };

// Session-gated, never cached (blueprint §1 CSR/authenticated pattern, same as /admin).
export const dynamic = "force-dynamic";

const TYPE_BADGE: Record<FeedbackType, string> = {
  bug: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  feature: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  general: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

const TYPE_LABEL: Record<FeedbackType, string> = {
  bug: "Bug 🐛",
  feature: "Feature 💡",
  general: "General 💬",
};

export default async function AdminFeedbackPage() {
  const requestHeaders = await headers();
  const user = await getCurrentUser(requestHeaders);

  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <SignInPrompt />
      </main>
    );
  }

  const admin = await getAdminUser(requestHeaders);
  if (!admin) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const entries = await getAllFeedbackForAdmin();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Feedback & Bugs</h1>
        <a href="/admin" className="text-sm text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300">
          Blog Posts
        </a>
      </div>

      {entries.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No feedback yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Message</th>
                <th className="py-2 pr-4 font-medium">From</th>
                <th className="py-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const type = entry.type as FeedbackType;
                return (
                  <tr key={entry.id} className="border-b border-neutral-100 align-top dark:border-neutral-900">
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TYPE_BADGE[type]}`}>
                        {TYPE_LABEL[type]}
                      </span>
                    </td>
                    <td className="max-w-md py-3 pr-4 whitespace-pre-wrap">{entry.message}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                          entry.userId
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {entry.userId ? `User: ${entry.email ?? "—"}` : entry.email ? `Guest: ${entry.email}` : "Guest"}
                      </span>
                    </td>
                    <td className="py-3 whitespace-nowrap text-neutral-500">{entry.createdAt.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
