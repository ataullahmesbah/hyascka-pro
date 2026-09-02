import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/**
 * Constant-ish work even for a non-existent account, so response timing does
 * not reveal whether an email is registered (PRD §21 — no information leaks).
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7pQ3lQvGqXhOFXjJHLDl3CqZ3Q5G9Vy";

export async function fakeVerify() {
  await bcrypt.compare("timing-equaliser", DUMMY_HASH);
}
