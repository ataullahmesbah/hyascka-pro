"use server";

import { redirect } from "next/navigation";

import { prisma, isDatabaseConfigured } from "@/lib/db";
import { hashPassword, fakeVerify, verifyPassword } from "@/lib/auth/password";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { createSession, destroySession, getCurrentUser, requestContext } from "@/lib/auth/session";
import { audit, securityEvent } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { emailLayout, sendEmail } from "@/lib/providers/email";
import { enqueue } from "@/lib/providers/jobs";
import { newEventId, sendConversionEvent } from "@/lib/tracking";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  toActionState,
  type ActionState,
} from "@/lib/validation";
import { siteUrl } from "@/lib/seo";

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

export async function loginAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { email, password, redirectTo } = parsed.data;

  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Authentication needs a database. Set DATABASE_URL and run the seed." };
  }

  const { ipAddress, userAgent } = await requestContext();
  const limit = await rateLimit("login", `${ipAddress ?? "unknown"}:${email}`);
  if (!limit.success) {
    await securityEvent({ email, type: "RATE_LIMITED", detail: "login" });
    return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Identical response and comparable timing whether or not the account exists.
  if (!user) {
    await fakeVerify();
    await securityEvent({ email, type: "LOGIN_FAILED", detail: "unknown account" });
    return { ok: false, message: "Email or password is incorrect." };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      ok: false,
      message: `This account is temporarily locked after repeated failed attempts. Try again after ${user.lockedUntil.toLocaleTimeString()}.`,
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failedLoginCount = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount,
        lockedUntil:
          failedLoginCount >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60_000)
            : null,
      },
    });
    await securityEvent({ userId: user.id, email, type: "LOGIN_FAILED", detail: "wrong password" });
    return { ok: false, message: "Email or password is incorrect." };
  }

  if (user.status === "SUSPENDED" || user.status === "DISABLED") {
    await securityEvent({ userId: user.id, email, type: "SUSPICIOUS", detail: `login on ${user.status} account` });
    return {
      ok: false,
      message: "This account is not active. Contact support@hyascka.com if you believe this is wrong.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    ipAddress,
    userAgent,
  });

  await securityEvent({ userId: user.id, email, type: "LOGIN_SUCCESS" });
  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    summary: `${user.email} signed in`,
  });

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

export async function registerAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const input = parsed.data;

  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Registration needs a database. Set DATABASE_URL and run the seed." };
  }

  const { ipAddress, userAgent } = await requestContext();
  const limit = await rateLimit("register", ipAddress ?? input.email);
  if (!limit.success) {
    return { ok: false, message: "Too many sign-up attempts from this connection. Try again later." };
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    // Do not confirm that an address is registered; point the user at recovery.
    return {
      ok: false,
      message:
        "If that email can be registered, you will receive a message shortly. If you already have an account, use “Forgot password”.",
    };
  }

  const passwordHash = await hashPassword(input.password);
  const { token, tokenHash } = createToken();

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      phone: input.phone || null,
      passwordHash,
      role: "CLIENT",
      status: "ACTIVE",
      clientProfile: {
        create: {
          companyName: input.company || null,
          billingEmail: input.email,
          referralCode: `HY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        },
      },
      tokens: {
        create: {
          tokenHash,
          purpose: "EMAIL_VERIFY",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      },
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await audit({
    actorId: user.id,
    actorRole: "CLIENT",
    action: "auth.register",
    entityType: "User",
    entityId: user.id,
    summary: `New client account created for ${user.email}`,
  });

  await notify({
    userId: user.id,
    type: "CLIENT_CREATED",
    title: "Welcome to HYASCKA",
    body: "Your account is ready. Complete your profile so we can set up billing details correctly.",
    href: "/dashboard/profile",
    email: false,
  });

  await enqueue("notification.deliver", { userId: user.id }, async () => {
    await sendEmail({
      to: user.email,
      subject: "Verify your HYASCKA account",
      html: emailLayout(
        `Welcome, ${user.name.split(" ")[0]}`,
        "<p>Confirm your email address to finish setting up your HYASCKA account. This link expires in 24 hours.</p>",
        { label: "Verify email", href: `${siteUrl()}/verify-email?token=${token}` },
      ),
      text: `Verify your email: ${siteUrl()}/verify-email?token=${token}`,
    });
  });

  await sendConversionEvent({
    eventName: "CompleteRegistration",
    eventId: newEventId(),
    email: user.email,
    clientIp: ipAddress,
    userAgent,
  });

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    ipAddress,
    userAgent,
  });

  redirect("/dashboard?welcome=1");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await audit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.logout",
      entityType: "User",
      entityId: user.id,
      summary: `${user.email} signed out`,
    });
  }
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { email } = parsed.data;

  // The response is identical whether or not the account exists.
  const genericResponse: ActionState = {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.",
  };

  if (!isDatabaseConfigured()) return genericResponse;

  const { ipAddress } = await requestContext();
  const limit = await rateLimit("passwordReset", ipAddress ?? email);
  if (!limit.success) {
    await securityEvent({ email, type: "RATE_LIMITED", detail: "password reset" });
    return genericResponse;
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) return genericResponse;

  const { token, tokenHash } = createToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      purpose: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await securityEvent({ userId: user.id, email, type: "PASSWORD_RESET", detail: "reset requested" });

  await enqueue("notification.deliver", { userId: user.id }, async () => {
    await sendEmail({
      to: email,
      subject: "Reset your HYASCKA password",
      html: emailLayout(
        "Reset your password",
        "<p>Use the button below to choose a new password. The link expires in one hour. If you did not request this, you can ignore this email — nothing has changed.</p>",
        { label: "Reset password", href: `${siteUrl()}/reset-password?token=${token}` },
      ),
      text: `Reset your password: ${siteUrl()}/reset-password?token=${token}`,
    });
  });

  return genericResponse;
}

export async function resetPasswordAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);

  if (!isDatabaseConfigured()) return { ok: false, message: "Password reset needs a database." };

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, purpose: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.purpose !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "That reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
    }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Every other session is invalidated when a password changes.
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await audit({
    actorId: record.userId,
    action: "auth.password_reset",
    entityType: "User",
    entityId: record.userId,
    summary: "Password reset completed; all sessions revoked",
  });

  return { ok: true, message: "Your password is updated. You can sign in now." };
}

export async function verifyEmailAction(token: string) {
  if (!isDatabaseConfigured()) return false;
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, purpose: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.purpose !== "EMAIL_VERIFY" || record.usedAt || record.expiresAt < new Date()) {
    return false;
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return true;
}

export async function changePasswordAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record || !(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    await securityEvent({ userId: user.id, email: user.email, type: "SUSPICIOUS", detail: "wrong current password" });
    return { ok: false, message: "Your current password is not correct.", fieldErrors: { currentPassword: ["Incorrect password."] } };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null, id: { not: user.sessionId } },
      data: { revokedAt: new Date() },
    }),
  ]);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.password_change",
    entityType: "User",
    entityId: user.id,
    summary: "Password changed; other sessions revoked",
  });

  return { ok: true, message: "Password updated. Every other session has been signed out." };
}

export async function revokeSessionAction(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  // Ownership check: a session id alone proves nothing (PRD §41.4).
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });
  if (!session || session.userId !== user.id) throw new Error("Session not found.");

  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.session_revoked",
    entityType: "Session",
    entityId: sessionId,
    summary: "Session revoked from the Security page",
  });
}
