import { NextResponse } from "next/server";

import { getSettings } from "@/lib/settings";

/**
 * Minimal, public, non-sensitive status endpoint. Its only consumer is the
 * middleware, which cannot reach the database from the edge runtime but must
 * know whether full maintenance mode is on (PRD §45.1). Nothing private is
 * exposed here.
 */
export const revalidate = 30;

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(
    {
      maintenance: settings.maintenance.isFullModeActive,
      endAt: settings.maintenance.endAt,
    },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
  );
}
