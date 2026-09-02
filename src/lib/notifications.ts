import "server-only";

import type { NotificationType, Role } from "@prisma/client";

import { prisma, isDatabaseConfigured } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/providers/email";
import { sendTelegram } from "@/lib/providers/telegram";
import { enqueue } from "@/lib/providers/jobs";
import { getSettings } from "@/lib/settings";

/**
 * In-app notifications are the source of truth; email and Telegram are
 * delivery channels layered on top, each with its own delivery log so a failed
 * send can be retried without duplicating the notification (PRD §16).
 */
export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, unknown>;
  email?: boolean;
  telegram?: boolean;
};

export async function notify(input: NotifyInput) {
  if (!isDatabaseConfigured()) return null;

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: (input.metadata ?? {}) as object,
    },
    select: { id: true, user: { select: { email: true, name: true } } },
  });

  const settings = await getSettings();
  const wantsEmail = (input.email ?? true) && settings.notifications.emailEnabled;
  const wantsTelegram = (input.telegram ?? false) && settings.notifications.telegramEnabled;

  await prisma.notificationDelivery.createMany({
    data: [
      { notificationId: notification.id, channel: "IN_APP", status: "SENT", sentAt: new Date() },
      ...(wantsEmail ? [{ notificationId: notification.id, channel: "EMAIL" as const }] : []),
      ...(wantsTelegram ? [{ notificationId: notification.id, channel: "TELEGRAM" as const }] : []),
    ],
  });

  if (wantsEmail || wantsTelegram) {
    await enqueue("notification.deliver", { id: notification.id }, async () => {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      if (wantsEmail) {
        const result = await sendEmail({
          to: notification.user.email,
          subject: input.title,
          html: emailLayout(
            input.title,
            `<p>${escapeHtml(input.body)}</p>`,
            input.href ? { label: "Open in dashboard", href: `${siteUrl}${input.href}` } : undefined,
          ),
          text: input.body,
        });
        await markDelivery(notification.id, "EMAIL", result.ok, result.ok ? undefined : result.error);
      }
      if (wantsTelegram) {
        const result = await sendTelegram(`<b>${escapeHtml(input.title)}</b>\n${escapeHtml(input.body)}`);
        await markDelivery(notification.id, "TELEGRAM", result.ok, result.error);
      }
    });
  }

  return notification.id;
}

async function markDelivery(
  notificationId: string,
  channel: "EMAIL" | "TELEGRAM",
  ok: boolean,
  error?: string,
) {
  await prisma.notificationDelivery
    .updateMany({
      where: { notificationId, channel },
      data: {
        status: ok ? "SENT" : "FAILED",
        sentAt: ok ? new Date() : null,
        lastError: error ?? null,
        attempts: { increment: 1 },
      },
    })
    .catch(() => undefined);
}

/** Fan a notification out to every staff member holding one of these roles. */
export async function notifyRoles(roles: Role[], input: Omit<NotifyInput, "userId">) {
  if (!isDatabaseConfigured()) return;
  const recipients = await prisma.user.findMany({
    where: { role: { in: roles }, status: "ACTIVE" },
    select: { id: true },
  });
  await Promise.all(recipients.map((user) => notify({ ...input, userId: user.id })));
}

export async function unreadCount(userId: string) {
  if (!isDatabaseConfigured()) return 0;
  return prisma.notification.count({ where: { userId, read: false } }).catch(() => 0);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
