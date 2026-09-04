import { NextResponse } from "next/server";

import { getSettings } from "@/lib/settings";

/**
 * Minimal, public, non-sensitive status endpoint. Its only consumer is the
 * middleware, which cannot reach the database from the edge runtime but must
 * know whether full maintenance mode is on (PRD §45.1). Nothing private is
 * exposed here.
 */
/*
 * Never cached. This is the kill switch for the whole public site, so an admin
 * ticking "take the site offline" has to see it take effect on the next
 * request, not up to a couple of minutes later once a cached copy expires.
 * It is one indexed read of a settings row.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(
    {
      maintenance: settings.maintenance.isFullModeActive,
      endAt: settings.maintenance.endAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
