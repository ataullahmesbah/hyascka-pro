import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyPaymentsPage() {
  const { clientId } = await requireClient();

  const payments = await prisma.payment.findMany({
    where: { invoice: { clientId } },
    orderBy: { createdAt: "desc" },
    include: { invoice: { select: { id: true, number: true } } },
  });

  const verified = payments
    .filter((payment) => payment.status === "VERIFIED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const pending = payments.filter((payment) => payment.status === "PENDING_VERIFICATION").length;

  return (
    <>
      <DashboardHeader
        title="Payments"
        description="Everything you have submitted, and where each one stands."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total verified" value={formatCurrency(verified)} icon="CheckCircle2" tone="success" />
        <StatCard label="Awaiting verification" value={pending} icon="Clock" tone={pending ? "warning" : "success"} />
        <StatCard label="Submissions" value={payments.length} icon="CreditCard" tone="info" />
      </div>

      <Panel>
        {payments.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[44rem]">
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Invoice</Th>
                  <Th>Method</Th>
                  <Th>Transaction ID</Th>
                  <Th>Amount</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <Tr key={payment.id}>
                    <Td className="font-mono text-xs">{payment.reference}</Td>
                    <Td>
                      <LinkCell href={`/dashboard/my-invoices/${payment.invoice.id}`}>
                        {payment.invoice.number}
                      </LinkCell>
                    </Td>
                    <Td className="text-ink-muted">{payment.method.replace(/_/g, " ")}</Td>
                    <Td className="font-mono text-xs text-ink-muted">{payment.trxId ?? "—"}</Td>
                    <Td className="font-medium">{formatCurrency(Number(payment.amount), payment.currency)}</Td>
                    <Td className="whitespace-nowrap text-ink-muted">{formatDate(payment.createdAt)}</Td>
                    <Td>
                      <StatusBadge status={payment.status} />
                      {payment.rejectionReason ? (
                        <p className="mt-1 max-w-xs text-xs text-danger">{payment.rejectionReason}</p>
                      ) : null}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState
            icon="CreditCard"
            title="No payments submitted"
            description="Open an invoice to pay it and submit your transaction ID."
            action={{ label: "View invoices", href: "/dashboard/my-invoices" }}
          />
        )}
      </Panel>
    </>
  );
}
