import Link from "next/link";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { MarkAllRead } from "@/components/dashboard/notification-controls";
import { EmptyState, Pagination } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { cn, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));
  const unreadOnly = query.filter === "unread";

  const where = { userId: user.id, ...(unreadOnly ? { read: false } : {}) };

  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You are all caught up."}
        actions={unread ? <MarkAllRead /> : null}
      />

      <div className="mb-5 flex gap-2">
        <Link
          href="/dashboard/notifications"
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            !unreadOnly ? "border-accent bg-accent-soft text-accent" : "border-line hover:bg-surface-2",
          )}
        >
          All
        </Link>
        <Link
          href="/dashboard/notifications?filter=unread"
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            unreadOnly ? "border-accent bg-accent-soft text-accent" : "border-line hover:bg-surface-2",
          )}
        >
          Unread {unread ? `(${unread})` : ""}
        </Link>
      </div>

      <Panel>
        {notifications.length ? (
          <>
            <ul className="divide-y divide-line">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={`/dashboard/notifications/${notification.id}`}
                    className={cn(
                      "-mx-2 flex items-start gap-3 rounded-lg px-2 py-4 transition-colors hover:bg-surface-2/60",
                      !notification.read && "bg-accent-soft/35",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        notification.read ? "bg-transparent" : "bg-accent",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{notification.title}</span>
                      <span className="mt-0.5 block text-sm text-ink-muted">{notification.body}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageCount={Math.ceil(total / PAGE_SIZE)}
              basePath="/dashboard/notifications"
              searchParams={query}
            />
          </>
        ) : (
          <EmptyState icon="Bell" title="No notifications" description="Alerts about leads, payments, projects and messages arrive here." />
        )}
      </Panel>
    </>
  );
}
