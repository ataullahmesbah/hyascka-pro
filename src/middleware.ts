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

  if (pathname.startsWith("/dashboard")) {
    if (!claims) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (claims && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname !== "/maintenance" && !(claims && STAFF_ROLES.has(claims.role))) {
    if (await maintenanceIsOn(request)) {
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
}

async function maintenanceIsOn(request: NextRequest) {
  try {
    const response = await fetch(new URL("/api/system/status", request.url), {
      next: { revalidate: 30 },
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
     * Everything except Next internals, the API surface and static assets —
     * those must never be rewritten to the maintenance page.
     */
    "/((?!_next/static|_next/image|api/|favicon|apple-touch-icon|android-chrome|og-image|brand/|site.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
