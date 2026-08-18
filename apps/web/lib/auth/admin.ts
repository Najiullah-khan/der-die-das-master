import { getCurrentUser } from "@/lib/auth/session";

/** Returns the current user if signed in and their email matches `ADMIN_EMAIL`, else null. */
export async function getAdminUser(headers: Headers) {
  const user = await getCurrentUser(headers);
  if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}
