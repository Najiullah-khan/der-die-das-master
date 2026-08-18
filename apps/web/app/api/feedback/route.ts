import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createFeedback } from "@/lib/db/queries/feedback";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  type: z.enum(["bug", "feature", "general"]),
  message: z.string().trim().min(1).max(2000),
  // Guest-only in practice — authed users' email comes from their account, not the request body.
  email: z.string().trim().email().max(320).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request.headers);

  const { allowed } = await checkRateLimit("feedback:submit", user?.id ?? getClientIp(request.headers), 5);
  if (!allowed) return rateLimitResponse();

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { type, message, email } = parsed.data;

  const id = await createFeedback({
    userId: user?.id ?? null,
    // Authed users' email is attached automatically from their account; a guest's is whatever
    // they optionally typed in, never trusted/overridden by anything client-supplied for authed users.
    email: user ? user.email : (email ?? null),
    type,
    message,
  });

  return NextResponse.json({ id }, { status: 201 });
}
