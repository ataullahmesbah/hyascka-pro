import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { RefundForm } from "@/components/dashboard/refund-form";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const user = await requirePermission("finance.read");
  const canRefund = can(toActor(user), "refund.create");

  const [refunds, refundable] = await Promise.all([
    prisma.refund.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        invoice: { select: { id: true, number: true, client: { select: { companyName: true } } } },
        payment: { select: { reference: true, method: true } },
        createdBy: { select: { name: true } },
      },
    }),
    canRefund
      ? prisma.payment.findMany({
          where: { status: "VERIFIED" },
          orderBy: { verifiedAt: "desc" },
          take: 50,
          select: {
            id: true,
            reference: true,
            amount: true,
            currency: true,
            invoice: { select: { number: true, client: { select: { companyName: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <>
      <DashboardHeader
        title="Refunds"
        description="Refunds reverse a verified payment. The original record is retained — nothing is deleted."
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <Panel title="Refund history">
          {refunds.length ? (
            <TableWrap className="border-0">
              <Table className="min-w-[44rem]">
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Invoice</Th>
                    <Th>Client</Th>
                    <Th>Reason</Th>
                    <Th>Raised by</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <Tr key={refund.id}>
                      <Td className="font-mono text-xs">{refund.reference}</Td>
                      <Td>
                        <LinkCell href={`/dashboard/finance/invoices/${refund.invoice.id}`}>
                          {refund.invoice.number}
                        </LinkCell>
                      </Td>
                      <Td className="text-muted-foreground">
                        {refund.invoice.client.companyName ?? "—"}
                      </Td>
                      <Td className="max-w-xs truncate text-muted-foreground">{refund.reason}</Td>
                      <Td className="text-muted-foreground">
                        {refund.createdBy?.name ?? "—"}
                        <span className="block text-xs">{formatDate(refund.createdAt)}</span>
                      </Td>
                      <Td className="text-right font-medium text-danger">
                        −{formatCurrency(Number(refund.amount), refund.currency)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState icon="Undo2" title="No refunds raised" />
          )}
        </Panel>

        {canRefund ? (
          <Panel title="Raise a refund" description="Only a verified payment can be refunded.">
            <RefundForm
              payments={refundable.map((payment) => ({
                id: payment.id,
                label: `${payment.reference} · ${payment.invoice.number} · ${formatCurrency(
                  Number(payment.amount),
                  payment.currency,
                )}`,
                max: Number(payment.amount),
              }))}
            />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
