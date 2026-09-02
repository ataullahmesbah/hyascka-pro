import { notFound } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { markNotificationRead } from "@/actions/notifications";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  // Scoped by userId, so another account's notification is simply not found.
  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  });
  if (!notification) notFound();

  // Opening a notification marks it read and routes onward (PRD §16).
  if (!notification.read) await markNotificationRead(notification.id);

  return (
    <>
      <DashboardHeader
        title={notification.title}
        description={formatDate(notification.createdAt, true)}
        breadcrumbs={[{ label: "Notifications", href: "/dashboard/notifications" }, { label: "Detail" }]}
      />

      <Panel>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
          {notification.body}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {notification.href ? <ButtonLink href={notification.href}>Open related page</ButtonLink> : null}
          <ButtonLink href="/dashboard/notifications" variant="outline">
            Back to notifications
          </ButtonLink>
        </div>
      </Panel>
    </>
  );
}
