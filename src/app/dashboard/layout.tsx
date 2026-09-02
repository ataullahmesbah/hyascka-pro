import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/auth/guards";
import { navigationFor, ROLE_LABELS } from "@/lib/rbac";
import { toActor } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { unreadCount } from "@/lib/notifications";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: "noindex, nofollow",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Layer two of deny-by-default: middleware redirects unauthenticated
  // requests, and this re-resolves the session against the database on every
  // render. Neither layer trusts the other (PRD §41.4).
  const user = await requireUser();

  const [settings, unread, recent] = await Promise.all([
    getSettings(),
    unreadCount(user.id),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, body: true, href: true, read: true, createdAt: true },
    }),
  ]);

  return (
    <DashboardShell
      navigation={navigationFor(toActor(user))}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: ROLE_LABELS[user.role],
        avatarUrl: user.avatarUrl,
      }}
      siteName={settings.brand.siteName}
      unread={unread}
      notifications={recent.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))}
    >
      {children}
    </DashboardShell>
  );
}
