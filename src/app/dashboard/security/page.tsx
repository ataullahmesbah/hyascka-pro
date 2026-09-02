import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ChangePasswordForm, SessionList } from "@/components/dashboard/account-forms";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await requireUser();

  const [sessions, events] = await Promise.all([
    prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: "desc" },
    }),
    prisma.securityEvent.findMany({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Security"
        description="Change your password, review where you are signed in, and check recent security activity."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel title="Change password" description="Changing it signs out every other session.">
          <ChangePasswordForm />
        </Panel>

        <div className="space-y-5">
          <Panel title="Active sessions">
            <SessionList
              currentSessionId={user.sessionId}
              sessions={sessions.map((session) => ({
                id: session.id,
                userAgent: session.userAgent,
                ipAddress: session.ipAddress,
                lastActiveAt: session.lastActiveAt.toISOString(),
                createdAt: session.createdAt.toISOString(),
              }))}
            />
          </Panel>

          <Panel title="Recent security activity">
            {events.length ? (
              <ul className="divide-y divide-border">
                {events.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{event.type}</code>
                    <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                      {event.detail ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(event.createdAt, true)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No security events on your account.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
