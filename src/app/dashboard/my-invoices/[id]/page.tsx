import { notFound } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { PaymentSubmission } from "@/components/dashboard/payment-submission";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { clientId } = await requireClient();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, clientId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!invoice) notFound();

  // Only methods the dashboard has switched on are offered (PRD §43.1, §50).
  const methods = await prisma.paymentMethodConfig.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: {
      method: true,
      label: true,
      accountName: true,
      accountNumber: true,
      branch: true,
      instructions: true,
      minAmount: true,
      maxAmount: true,
    },
  });

  const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
  const payable = outstanding > 0 && !["VOID", "PAID"].includes(invoice.status);

  return (
    <>
      <DashboardHeader
        title={`Invoice ${invoice.number}`}
        description={`Issued ${formatDate(invoice.issueDate)} · due ${formatDate(invoice.dueDate)}`}
        breadcrumbs={[{ label: "Invoices", href: "/dashboard/my-invoices" }, { label: invoice.number }]}
        actions={<StatusBadge status={invoice.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <Panel title="Items">
            <TableWrap className="border-0">
              <Table className="min-w-[32rem]">
                <thead>
                  <tr>
                    <Th>Description</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Unit price</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item.description}</Td>
                      <Td className="text-right">{item.quantity}</Td>
                      <Td className="text-right">{formatCurrency(Number(item.unitPrice), invoice.currency)}</Td>
                      <Td className="text-right font-medium">
                        {formatCurrency(Number(item.total), invoice.currency)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>

            <dl className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd>{formatCurrency(Number(invoice.subtotal), invoice.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tax</dt>
                <dd>{formatCurrency(Number(invoice.tax), invoice.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(Number(invoice.total), invoice.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Paid</dt>
                <dd>{formatCurrency(Number(invoice.amountPaid), invoice.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-display text-base font-bold">
                <dt>Outstanding</dt>
                <dd>{formatCurrency(outstanding, invoice.currency)}</dd>
              </div>
            </dl>

            {invoice.notes ? (
              <p className="mt-5 rounded-lg bg-surface-2/60 p-4 text-sm text-ink-muted">{invoice.notes}</p>
            ) : null}
          </Panel>

          <Panel title="Your payments">
            {invoice.payments.length ? (
              <ul className="divide-y divide-line">
                {invoice.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {formatCurrency(Number(payment.amount), payment.currency)} ·{" "}
                        {payment.method.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-ink-muted">
                        TrxID {payment.trxId ?? "—"} · submitted {formatDate(payment.createdAt, true)}
                      </p>
                      {payment.rejectionReason ? (
                        <p className="mt-1 text-xs text-danger">Rejected: {payment.rejectionReason}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={payment.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No payments submitted for this invoice yet.</p>
            )}
          </Panel>
        </div>

        <aside>
          {payable ? (
            <Panel title="Pay this invoice">
              {methods.length ? (
                <PaymentSubmission
                  invoiceId={invoice.id}
                  outstanding={outstanding}
                  currency={invoice.currency}
                  methods={methods.map((method) => ({
                    method: method.method,
                    label: method.label,
                    accountName: method.accountName,
                    accountNumber: method.accountNumber,
                    branch: method.branch,
                    instructions: method.instructions,
                    minAmount: method.minAmount ? Number(method.minAmount) : null,
                    maxAmount: method.maxAmount ? Number(method.maxAmount) : null,
                  }))}
                />
              ) : (
                <p className="text-sm text-ink-muted">
                  No payment methods are active right now. Please contact us and we will arrange it.
                </p>
              )}
            </Panel>
          ) : (
            <Panel title="Payment">
              <p className="text-sm text-ink-muted">
                {invoice.status === "PAID"
                  ? "This invoice is fully settled. Thank you."
                  : "This invoice is not open for payment."}
              </p>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
