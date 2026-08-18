import { desc } from "drizzle-orm";
import type { FeedbackType } from "@ddd/shared";
import { db } from "@/lib/db/client";
import { feedback } from "@/lib/db/schema";

export interface NewFeedback {
  userId: string | null;
  email: string | null;
  type: FeedbackType;
  message: string;
}

export async function createFeedback(input: NewFeedback): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(feedback).values({ id, ...input, createdAt: new Date() });
  return id;
}

/** Newest first, for the /admin/feedback table. */
export async function getAllFeedbackForAdmin() {
  return db.select().from(feedback).orderBy(desc(feedback.createdAt));
}
