import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { requireAnyPermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  await requireAnyPermission(["clients.manage", "projects.manage"]);

  const requests = await prisma.serviceRequest.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { companyName: true, user: { select: { name: true } } } },
      service: { select: { title: true } },
      _count: { select: { updates: true } },
    },
  });

  const awaitingCancellation = requests.filter(
    (request) => request.cancelRequestedAt && !request.cancelledAt,
  ).length;

  return (
    <>
      <DashboardHeader
        title="Service requests"
        description="What clients have asked for, how far along each one is, and the conversation on it."
        breadcrumbs={[{ label: "Requests" }]}
      />

      {awaitingCancellation ? (
        <div className="mb-5 rounded-lg border border-warning/40 bg-warning-soft p-4 text-step--1 text-warning">
          {awaitingCancellation} request{awaitingCancellation === 1 ? "" : "s"} awaiting a decision on
          cancellation.
        </div>
      ) : null}

      <Panel>
        {requests.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[46rem]">
              <thead>
                <tr>
                  <Th>Request</Th>
                  <Th>Client</Th>
                  <Th>Service</Th>
                  <Th>Progress</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <Tr key={request.id}>
                    <Td>
                      <LinkCell href={`/dashboard/requests/${request.id}`}>{request.title}</LinkCell>
                      <p className="text-xs text-ink-muted">
                        {request.reference} · {request._count.updates} message
                        {request._count.updates === 1 ? "" : "s"}
                      </p>
                    </Td>
                    <Td className="text-ink-muted">
                      {request.client.companyName ?? request.client.user?.name ?? "—"}
                    </Td>
                    <Td className="text-ink-muted">{request.service?.title ?? "Custom"}</Td>
                    <Td className="tabular text-ink-muted">{request.progress}%</Td>
                    <Td>
                      <StatusBadge status={request.status} />
                      {request.cancelRequestedAt && !request.cancelledAt ? (
                        <span className="ml-1.5 rounded-pill bg-warning/20 px-2 py-0.5 text-[0.65rem] font-medium text-warning">
                          cancel asked
                        </span>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {formatDate(request.updatedAt)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState
            icon="ClipboardList"
            title="No service requests yet"
            description="They arrive here when a client asks for work through the site or their portal."
          />
        )}
      </Panel>
    </>
  );
}
