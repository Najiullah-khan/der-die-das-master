import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";

/**
 * Lets client components (the nav account menu, the footer admin link) learn whether the
 * current session is the admin without ever shipping `ADMIN_EMAIL` itself to the client bundle.
 * Deliberately not exposed anywhere in the main nav — see Navbar/AdminFooterLink for the only
 * two (discreet) places this gates a link (blog UI spec: "Discreet Admin Access").
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request.headers);
  return NextResponse.json({ isAdmin: Boolean(admin) });
}
