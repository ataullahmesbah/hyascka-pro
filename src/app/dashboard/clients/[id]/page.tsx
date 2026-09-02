import { notFound, redirect } from "next/navigation";

import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { canAccessClient, requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("clients.read");
  const { id } = await params;

  // Ownership re-checked here: a valid id belonging to someone else is not
  // enough (PRD §41.4 — IDOR protection).
  if (!(await canAccessClient(user, id))) redirect("/dashboard?denied=1");

  const client = await prisma.clientProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, status: true, lastLoginAt: true } },
      projects: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, status: true, progress: true, dueDate: true },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, number: true, status: true, total: true, amountPaid: true, currency: true, dueDate: true },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, reference: true, subject: true, status: true },
      },
    },
  });
  if (!client) notFound();

  const showFinance = can(toActor(user), "finance.read");
  const outstanding = client.invoices.reduce(
    (sum, invoice) =>
      ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)
        ? sum + Number(invoice.total) - Number(invoice.amountPaid)
        : sum,
    0,
  );

  return (
    <>
      <DashboardHeader
        title={client.companyName ?? client.user.name}
        description={`${client.user.email} · client since ${formatDate(client.createdAt)}`}
        breadcrumbs={[{ label: "Clients", href: "/dashboard/clients" }, { label: client.companyName ?? client.user.name }]}
        actions={<StatusBadge status={client.user.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={client.projects.length} icon="FolderKanban" />
        <StatCard label="Invoices" value={client.invoices.length} icon="FileText" />
        {showFinance ? (
          <StatCard
            label="Outstanding"
            value={formatCurrency(outstanding)}
            icon="Wallet"
            tone={outstanding > 0 ? "warning" : "success"}
          />
        ) : null}
        <StatCard
          label="Last sign-in"
          value={client.user.lastLoginAt ? formatDate(client.user.lastLoginAt) : "Never"}
          icon="Clock"
          tone="info"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <Panel title="Projects">
            {client.projects.length ? (
              <ul className="divide-y divide-border">
                {client.projects.map((project) => (
                  <li key={project.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <LinkCell href={`/dashboard/projects/${project.id}`}>{project.name}</LinkCell>
                      <p className="text-xs text-muted-foreground">
                        {project.progress}% complete
                        {project.dueDate ? ` · due ${formatDate(project.dueDate)}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="FolderKanban" title="No projects yet" />
            )}
          </Panel>

          {/* SUPPORT deliberately cannot see financial detail (PRD §42.7). */}
          {showFinance ? (
            <Panel title="Invoices">
              {client.invoices.length ? (
                <TableWrap className="border-0">
                  <Table className="min-w-[30rem]">
                    <thead>
                      <tr>
                        <Th>Invoice</Th>
                        <Th>Due</Th>
                        <Th>Total</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.invoices.map((invoice) => (
                        <Tr key={invoice.id}>
                          <Td>
                            <LinkCell href={`/dashboard/finance/invoices/${invoice.id}`}>{invoice.number}</LinkCell>
                          </Td>
                          <Td className="text-muted-foreground">{formatDate(invoice.dueDate)}</Td>
                          <Td className="font-medium">{formatCurrency(Number(invoice.total), invoice.currency)}</Td>
                          <Td>
                            <StatusBadge status={invoice.status} />
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              ) : (
                <EmptyState icon="FileText" title="No invoices yet" />
              )}
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Panel title="Account">
            <dl className="space-y-3 text-sm">
              <Row label="Contact" value={client.user.name} />
              <Row label="Email" value={client.user.email} />
              <Row label="Phone" value={client.user.phone ?? client.billingPhone ?? "—"} />
              <Row label="Billing email" value={client.billingEmail ?? "—"} />
              <Row
                label="Address"
                value={[client.addressLine1, client.city, client.country].filter(Boolean).join(", ") || "—"}
              />
              <Row label="Tax ID" value={client.taxId ?? "—"} />
              <Row label="Referral code" value={client.referralCode ?? "—"} />
            </dl>
          </Panel>

          <Panel title="Recent tickets">
            {client.tickets.length ? (
              <ul className="space-y-3">
                {client.tickets.map((ticket) => (
                  <li key={ticket.id} className="flex items-start justify-between gap-3">
                    <LinkCell href={`/dashboard/support/${ticket.id}`}>{ticket.subject}</LinkCell>
                    <StatusBadge status={ticket.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tickets raised.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
