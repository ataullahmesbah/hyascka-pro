import "server-only";

/**
 * Rate limiting for login, password reset, contact, messaging and payment
 * submission (PRD §20, §40.5, §41.2).
 *
 * Uses Upstash Redis when configured so the limit holds across serverless
 * instances; falls back to an in-process window otherwise, which is correct for
 * a single instance and honest about its limitation in development.
 */

const memory = new Map<string, { count: number; resetAt: number }>();

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export const RATE_LIMITS = {
  login: { limit: 5, windowSeconds: 300 },
  register: { limit: 5, windowSeconds: 3600 },
  passwordReset: { limit: 3, windowSeconds: 900 },
  contact: { limit: 5, windowSeconds: 3600 },
  message: { limit: 30, windowSeconds: 300 },
  payment: { limit: 10, windowSeconds: 3600 },
  newsletter: { limit: 3, windowSeconds: 3600 },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

async function upstash(command: (string | number)[]): Promise<unknown> {
  const response = await fetch(`${REST_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash error ${response.status}`);
  const data = (await response.json()) as { result?: unknown };
  return data.result;
}

export async function rateLimit(
  action: RateLimitKey,
  identifier: string,
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = RATE_LIMITS[action];
  const key = `rl:${action}:${identifier}`;
  const now = Date.now();

  if (REST_URL && REST_TOKEN) {
    try {
      const count = Number(await upstash(["INCR", key]));
      if (count === 1) await upstash(["EXPIRE", key, windowSeconds]);
      const ttl = Number(await upstash(["TTL", key]));
      return {
        success: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt: now + Math.max(ttl, 0) * 1000,
      };
    } catch (error) {
      console.error("[rate-limit] Upstash unavailable, falling back:", error);
    }
  }

  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, resetAt: now + windowSeconds * 1000 };
  }
  entry.count += 1;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}
