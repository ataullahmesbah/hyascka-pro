import { NextResponse } from "next/server";

import { AUTH_HINT_COOKIE, SESSION_COOKIE } from "@/lib/auth/jwt";

/**
 * Where a dead session goes to be cleared.
 *
 * A signed session cookie stays cryptographically valid after the session
 * behind it is revoked — which is exactly what happens when someone is
 * suspended or has their role changed. The middleware trusts the cookie and
 * sends them to the dashboard; the dashboard finds no session and sends them
 * to the login page; the middleware sees the cookie again. That is a redirect
 * loop, and the way out is to actually delete the cookie, which a Server
 * Component may not do. A route handler may.
 */
export async function GET(request: Request) {
  const reason = new URL(request.url).searchParams.get("reason");
  const target = new URL("/login", request.url);
  if (reason) target.searchParams.set("reason", reason);

  const response = NextResponse.redirect(target);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(AUTH_HINT_COOKIE);
  return response;
}
