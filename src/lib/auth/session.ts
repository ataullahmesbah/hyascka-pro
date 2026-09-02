import "server-only";

import { cookies, headers } from "next/headers";
import type { Role } from "@prisma/client";
import { randomBytes } from "crypto";

import { prisma, isDatabaseConfigured } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
  type SessionClaims,
} from "@/lib/auth/jwt";

export { SESSION_COOKIE, SESSION_MAX_AGE, signSessionToken, verifySessionToken };
export type { SessionClaims };

type CreateSessionArgs = {
  userId: string;
  role: Role;
  email: string;
  name: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

/**
 * Issues the session cookie AND persists a Session row, so a user can review
 * and revoke active sessions from the Security page (PRD §9, §41.4).
 */
export async function createSession(args: CreateSessionArgs) {
  const sessionSecret = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  const record = await prisma.session.create({
    data: {
      userId: args.userId,
      tokenHash: hashToken(sessionSecret),
      userAgent: args.userAgent ?? null,
      ipAddress: args.ipAddress ?? null,
      expiresAt,
    },
    select: { id: true },
  });

  const token = await signSessionToken({
    sub: args.userId,
    sid: record.id,
    role: args.role,
    email: args.email,
    name: args.name,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return record.id;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  store.delete(SESSION_COOKIE);
  if (!token || !isDatabaseConfigured()) return;

  const claims = await verifySessionToken(token);
  if (!claims) return;
  await prisma.session
    .update({ where: { id: claims.sid }, data: { revokedAt: new Date() } })
    .catch(() => undefined);
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  status: string;
  sessionId: string;
  clientProfileId: string | null;
  extraPermissions: string[];
  revokedPermissions: string[];
};

/**
 * Resolves the signed-in user from the cookie, re-validating against the
 * database on every call. Authorization is never cached client-side (§41.1).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isDatabaseConfigured()) return null;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const session = await prisma.session
    .findUnique({
      where: { id: claims.sid },
      select: {
        id: true,
        revokedAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            avatarUrl: true,
            clientProfile: { select: { id: true } },
            permissions: { select: { permission: true, granted: true } },
          },
        },
      },
    })
    .catch(() => null);

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  const user = session.user;
  if (user.status === "SUSPENDED" || user.status === "DISABLED") return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    status: user.status,
    sessionId: session.id,
    clientProfileId: user.clientProfile?.id ?? null,
    extraPermissions: user.permissions.filter((p) => p.granted).map((p) => p.permission),
    revokedPermissions: user.permissions.filter((p) => !p.granted).map((p) => p.permission),
  };
}

export async function requestContext() {
  const head = await headers();
  return {
    ipAddress:
      head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? head.get("x-real-ip") ?? null,
    userAgent: head.get("user-agent"),
  };
}
