import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * True when a real database is wired up. The public site is designed to render
 * from bundled default content when it is not, so a fresh clone runs with
 * `npm run dev` before Neon is provisioned (PRD §47: nothing should require a
 * developer to get the site on screen).
 */
export function isDatabaseConfigured() {
  const url = process.env.DATABASE_URL;
  return Boolean(url && !url.includes("user:password@ep-xxx"));
}

/**
 * Run a query, falling back to bundled content when the database is absent or
 * unreachable. Never used for authentication, finance or any private read —
 * those must fail loudly instead (see `requireDatabase`).
 */
export async function withFallback<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;
  try {
    return await query();
  } catch (error) {
    console.error("[db] query failed, serving fallback content:", error);
    return fallback;
  }
}

export function requireDatabase() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in .env.local, then run `npm run db:push && npm run db:seed`.",
    );
  }
}
