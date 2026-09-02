import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { StaffTicketForm, TicketForm } from "@/components/dashboard/ticket-forms";
import { ROLE_LABELS } from "@/lib/rbac";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireUser, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await requireUser();
  const isClient = user.role === "CLIENT";

  if (!isClient && !can(toActor(user), "support.read")) {
    return (
      <>
        <DashboardHeader title="Support" />
        <EmptyState icon="LifeBuoy" title="Support tickets are not part of your role" />
      </>
    );
  }

  const canManage = !isClient && can(toActor(user), "support.manage");

  const [staff, clientOptions] = canManage
    ? await Promise.all([
        prisma.user.findMany({
          where: { role: { not: "CLIENT" }, status: "ACTIVE" },
          select: { id: true, name: true, role: true },
          orderBy: { name: "asc" },
        }),
        prisma.clientProfile.findMany({
          select: { id: true, companyName: true, user: { select: { name: true } } },
          orderBy: { companyName: "asc" },
          take: 200,
        }),
      ])
    : [[], []];

  const tickets = await prisma.supportTicket.findMany({
    where: isClient ? { clientId: user.clientProfileId ?? "__none__" } : {},
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      reference: true,
      subject: true,
      category: true,
      status: true,
      priority: true,
      createdAt: true,
      client: { select: { companyName: true } },
      assignee: { select: { name: true } },
    },
  });

  return (
    <>
      <DashboardHeader
        title="Support"
        description={isClient ? "Raise and track support requests." : "Client support tickets."}
      />

      <div className={isClient || canManage ? "grid gap-5 lg:grid-cols-[1.5fr_0.6fr]" : ""}>
        <Panel title="Tickets">
          {tickets.length ? (
            <TableWrap className="border-0">
              <Table className="min-w-[44rem]">
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Subject</Th>
                    {!isClient ? <Th>Client</Th> : null}
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th>Opened</Th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <Tr key={ticket.id}>
                      <Td className="font-mono text-xs">{ticket.reference}</Td>
                      <Td>
                        <LinkCell href={`/dashboard/support/${ticket.id}`}>{ticket.subject}</LinkCell>
                        <p className="text-xs text-ink-muted">{ticket.category}</p>
                      </Td>
                      {!isClient ? (
                        <Td className="text-ink-muted">{ticket.client.companyName ?? "—"}</Td>
                      ) : null}
                      <Td>
                        <StatusBadge status={ticket.priority} />
                      </Td>
                      <Td>
                        <StatusBadge status={ticket.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">{formatDate(ticket.createdAt)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState
              icon="LifeBuoy"
              title="No tickets"
              description={isClient ? "Open one on the right and we will reply quickly." : "Nothing needs attention."}
            />
          )}
        </Panel>

        {isClient ? (
          <Panel title="Open a ticket">
            <TicketForm />
          </Panel>
        ) : null}

        {canManage ? (
          <Panel
            title="Create a ticket"
            description="Raise an internal token or file one on a client's behalf, and assign it straight away."
          >
            <StaffTicketForm
              staff={staff.map((member) => ({
                id: member.id,
                name: member.name,
                roleLabel: ROLE_LABELS[member.role],
              }))}
              clients={clientOptions.map((client) => ({
                id: client.id,
                label: client.companyName ?? client.user.name,
              }))}
            />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
