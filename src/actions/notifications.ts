"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/guards";

/**
 * Notification state is always scoped to the caller — a notification id from
 * another user's account can never be marked read from here (PRD §41.4).
 */
export async function markNotificationRead(notificationId: string) {
  const user = await authorize();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true, readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead() {
  const user = await authorize();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true, readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}
