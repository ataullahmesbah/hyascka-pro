import { createHash, randomBytes } from "crypto";

/** Opaque token for email verification / password reset links. */
export function createToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
