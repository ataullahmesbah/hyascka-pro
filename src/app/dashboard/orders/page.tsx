import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requirePermission("orders.read");

  const [requests, orders] = await Promise.all([
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        client: { select: { id: true, companyName: true } },
        service: { select: { title: true } },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { client: { select: { id: true, companyName: true } }, _count: { select: { items: true } } },
    }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Orders & requests"
        description="Service requests from clients, and the orders they become."
      />

      <Panel title="Service requests" className="mb-6">
        {requests.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[44rem]">
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Client</Th>
                  <Th>Request</Th>
                  <Th>Service</Th>
                  <Th>Status</Th>
                  <Th>Received</Th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <Tr key={request.id}>
                    <Td className="font-mono text-xs">{request.reference}</Td>
                    <Td>
                      <LinkCell href={`/dashboard/clients/${request.client.id}`}>
                        {request.client.companyName ?? "—"}
                      </LinkCell>
                    </Td>
                    <Td>{request.title}</Td>
                    <Td className="text-ink-muted">{request.service?.title ?? "—"}</Td>
                    <Td>
                      <StatusBadge status={request.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">{formatDate(request.createdAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState icon="ClipboardList" title="No service requests yet" />
        )}
      </Panel>

      <Panel title="Orders">
        {orders.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[40rem]">
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Client</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td className="font-mono text-xs">{order.reference}</Td>
                    <Td className="text-ink-muted">{order.client.companyName ?? "—"}</Td>
                    <Td className="text-ink-muted">{order._count.items}</Td>
                    <Td className="font-medium">{formatCurrency(Number(order.total), order.currency)}</Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">{formatDate(order.createdAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState icon="ShoppingBag" title="No orders yet" description="Accepted service requests become orders." />
        )}
      </Panel>
    </>
  );
}
