import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { EmptyState, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("audit.read");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));

  const [entries, total, securityEvents, failedLogins] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
    prisma.securityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.securityEvent.count({
      where: { type: "LOGIN_FAILED", createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Audit & security"
        description="Append-oriented record of every sensitive mutation, whether it came from an API route or a Server Action."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Audit entries" value={total} icon="ScrollText" />
        <StatCard label="Security events" value={securityEvents.length} icon="ShieldAlert" tone="info" />
        <StatCard
          label="Failed logins (24h)"
          value={failedLogins}
          icon="AlertTriangle"
          tone={failedLogins > 5 ? "danger" : "success"}
        />
      </div>

      <Panel title="Audit log" className="mb-6">
        {entries.length ? (
          <>
            <TableWrap className="border-0">
              <Table className="min-w-[52rem]">
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Actor</Th>
                    <Th>Action</Th>
                    <Th>Entity</Th>
                    <Th>Summary</Th>
                    <Th>IP</Th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <Tr key={entry.id}>
                      <Td className="whitespace-nowrap text-muted-foreground">
                        {formatDate(entry.createdAt, true)}
                      </Td>
                      <Td>
                        <p className="text-sm">{entry.actor?.name ?? "System"}</p>
                        <p className="text-xs text-muted-foreground">{entry.actorRole ?? "—"}</p>
                      </Td>
                      <Td>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{entry.action}</code>
                      </Td>
                      <Td className="text-muted-foreground">
                        {entry.entityType}
                        {entry.entityId ? (
                          <span className="block font-mono text-[11px]">{entry.entityId.slice(0, 12)}…</span>
                        ) : null}
                      </Td>
                      <Td className="text-muted-foreground">{entry.summary}</Td>
                      <Td className="font-mono text-xs text-muted-foreground">{entry.ipAddress ?? "—"}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <Pagination
              page={page}
              pageCount={Math.ceil(total / PAGE_SIZE)}
              basePath="/dashboard/audit"
              searchParams={query}
            />
          </>
        ) : (
          <EmptyState icon="ScrollText" title="No audit entries yet" />
        )}
      </Panel>

      <Panel title="Recent security events" description="Failed logins, rate-limit triggers and account security changes.">
        {securityEvents.length ? (
          <ul className="divide-y divide-border">
            {securityEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{event.type}</code>
                <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                  {event.email ?? "—"} {event.detail ? `· ${event.detail}` : ""}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{event.ipAddress ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(event.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No security events recorded.</p>
        )}
      </Panel>
    </>
  );
}
