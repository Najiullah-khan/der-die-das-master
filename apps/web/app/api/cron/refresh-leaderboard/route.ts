import { NextResponse, type NextRequest } from "next/server";
import { refreshLeaderboard } from "@/lib/db/queries/leaderboard";

/**
 * Meant to be called by a scheduled trigger, not end users — a Cloudflare Cron Trigger hitting
 * this route on a schedule in production (blueprint §14; wiring the actual trigger is a deploy-time
 * infra step, not something this route can configure itself). Protected by a shared secret since
 * it's a write endpoint with no end-user session behind it.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rowCount = await refreshLeaderboard();
  return NextResponse.json({ refreshed: rowCount });
}
