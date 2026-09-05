import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";

const STAFF_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
  "PROJECT_MANAGER",
  "EDITOR",
  "SUPPORT",
]);

const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);

/**
 * Routes that stay reachable while the site is in full maintenance mode.
 *
 * Sign-in especially: staff bypass maintenance, but they can only be
 * recognised as staff once they have a session, and they can only get one
 * through /login. Rewriting that to the maintenance page locks everybody out
 * of the site they just took offline, including the person who has to turn it
 * back on.
 */
const MAINTENANCE_EXEMPT = new Set([
  "/maintenance",
  "/session-ended",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

/**
 * The only API routes reachable without a session (PRD §9). Everything else
 * returns 401 here before it can execute, on top of the per-route checks — two
 * independent layers, neither trusting the other.
 */
const PUBLIC_API = ["/api/system/status", "/api/chat", "/api/contact"];

/**
 * Two jobs, both cheap enough for the edge:
 *
 * 1. Deny-by-default routing for /dashboard/* (PRD §41.4). This only verifies
 *    that a validly signed session cookie exists — the real authorization
 *    boundary is re-evaluated server-side on every page and Server Action.
 * 2. Full maintenance mode (PRD §45.1). The flag lives in the database, which
 *    edge middleware cannot reach, so it is read through a cached public status
 *    endpoint. Staff sessions bypass the maintenance page and keep working.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  // API allow-list: deny by default, exactly like the dashboard.
  if (pathname.startsWith("/api/")) {
    const isPublic = PUBLIC_API.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    if (!isPublic && !claims) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!claims) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // /session-ended is deliberately absent from AUTH_PAGES: it exists to delete
  // a cookie whose session is gone, so it must not be bounced to the dashboard
  // on the strength of that same cookie — that is the loop it breaks.
  if (claims && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!MAINTENANCE_EXEMPT.has(pathname) && !(claims && STAFF_ROLES.has(claims.role))) {
    if (await maintenanceIsOn(request)) {
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
}

async function maintenanceIsOn(request: NextRequest) {
  try {
    const response = await fetch(new URL("/api/system/status", request.url), {
      cache: "no-store",
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { maintenance?: boolean };
    return Boolean(data.maintenance);
  } catch {
    // Never take the site down because the status check failed.
    return false;
  }
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets. API routes are
     * included so the allow-list above runs, but they are returned early and
     * never rewritten to the maintenance page.
     */
    "/((?!_next/static|_next/image|favicon|apple-touch-icon|android-chrome|og-image|brand/|site.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
