import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { TicketForm } from "@/components/dashboard/ticket-forms";
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

      <div className={isClient ? "grid gap-5 lg:grid-cols-[1.5fr_0.5fr]" : ""}>
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
                        <p className="text-xs text-muted-foreground">{ticket.category}</p>
                      </Td>
                      {!isClient ? (
                        <Td className="text-muted-foreground">{ticket.client.companyName ?? "—"}</Td>
                      ) : null}
                      <Td>
                        <StatusBadge status={ticket.priority} />
                      </Td>
                      <Td>
                        <StatusBadge status={ticket.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-muted-foreground">{formatDate(ticket.createdAt)}</Td>
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
      </div>
    </>
  );
}
