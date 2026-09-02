import { NextResponse } from "next/server";

/**
 * Reserved public endpoint (PRD §9). The contact form itself posts through a
 * Server Action, which already carries the same validation, rate limiting and
 * persistence guarantees. This route exists so the public allow-list matches
 * the surface a third-party integration would expect, and so an accidental GET
 * gets a clear answer instead of a 404.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { message: "Use the contact form at /contact." },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "Submit the form at /contact — it posts through a Server Action." },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}
