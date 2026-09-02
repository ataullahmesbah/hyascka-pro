import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

/**
 * Edge-safe session token helpers. Deliberately free of Prisma and node:crypto
 * so `middleware.ts` can import them without pulling the Node runtime in.
 */
export const SESSION_COOKIE = "hyascka_session";

export const SESSION_MAX_AGE_DAYS = Number(process.env.SESSION_MAX_AGE_DAYS ?? 7);
export const SESSION_MAX_AGE = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

export type SessionClaims = {
  sub: string;
  sid: string;
  role: Role;
  email: string;
  name: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with `openssl rand -base64 48`.",
    );
  }
  return new TextEncoder().encode(value);
}

export async function signSessionToken(claims: SessionClaims) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer("hyascka")
    .setAudience("hyascka-dashboard")
    .setExpirationTime(`${SESSION_MAX_AGE_DAYS}d`)
    .sign(secret());
}

/** Signature and claim validation only — no database access. */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "hyascka",
      audience: "hyascka-dashboard",
    });
    if (!payload.sub || typeof payload.sid !== "string") return null;
    return {
      sub: payload.sub,
      sid: payload.sid,
      role: payload.role as Role,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
