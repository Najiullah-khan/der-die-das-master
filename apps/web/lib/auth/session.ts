import { auth } from "@/lib/auth/config";

/** Returns the current user if the request carries a valid session, or null for guests. */
export async function getCurrentUser(headers: Headers) {
  const result = await auth.api.getSession({ headers });
  return result?.user ?? null;
}
