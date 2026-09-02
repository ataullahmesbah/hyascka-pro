import { notFound, redirect } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { InvoiceActions } from "@/components/dashboard/invoice-actions";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { canAccessInvoice, requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("finance.read");
  const { id } = await params;

  if (!(await canAccessInvoice(user, id))) redirect("/dashboard?denied=1");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, companyName: true, addressLine1: true, city: true, country: true, taxId: true, user: { select: { name: true, email: true } } } },
      items: true,
      payments: { orderBy: { createdAt: "desc" }, include: { verifiedBy: { select: { name: true } } } },
      refunds: true,
      adjustments: true,
    },
  });
  if (!invoice) notFound();

  const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
  const canApprove = can(toActor(user), "finance.approve");

  return (
    <>
      <DashboardHeader
        title={`Invoice ${invoice.number}`}
        description={`${invoice.client.companyName ?? invoice.client.user.name} · issued ${formatDate(invoice.issueDate)}`}
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/finance/invoices" },
          { label: invoice.number },
        ]}
        actions={<StatusBadge status={invoice.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-5">
          <Panel title="Line items">
            <TableWrap className="border-0">
              <Table className="min-w-[36rem]">
                <thead>
                  <tr>
                    <Th>Description</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Unit price</Th>
                    <Th className="text-right">Tax</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item.description}</Td>
                      <Td className="text-right">{item.quantity}</Td>
                      <Td className="text-right">{formatCurrency(Number(item.unitPrice), invoice.currency)}</Td>
                      <Td className="text-right text-ink-muted">{Number(item.taxRate)}%</Td>
                      <Td className="text-right font-medium">
                        {formatCurrency(Number(item.total), invoice.currency)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>

            <dl className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
              <Line label="Subtotal" value={formatCurrency(Number(invoice.subtotal), invoice.currency)} />
              {Number(invoice.discount) > 0 ? (
                <Line label="Discount" value={`-${formatCurrency(Number(invoice.discount), invoice.currency)}`} />
              ) : null}
              <Line label="Tax" value={formatCurrency(Number(invoice.tax), invoice.currency)} />
              <Line
                label="Total"
                value={formatCurrency(Number(invoice.total), invoice.currency)}
                emphasis
              />
              <Line label="Paid" value={formatCurrency(Number(invoice.amountPaid), invoice.currency)} />
              <Line
                label="Outstanding"
                value={formatCurrency(outstanding, invoice.currency)}
                emphasis
              />
            </dl>
          </Panel>

          <Panel title="Payments against this invoice">
            {invoice.payments.length ? (
              <ul className="divide-y divide-line">
                {invoice.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {payment.reference} · {payment.method.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-ink-muted">
                        TrxID {payment.trxId ?? "—"} · {formatDate(payment.createdAt, true)}
                        {payment.verifiedBy ? ` · verified by ${payment.verifiedBy.name}` : ""}
                      </p>
                      {payment.rejectionReason ? (
                        <p className="mt-1 text-xs text-danger">Rejected: {payment.rejectionReason}</p>
                      ) : null}
                    </div>
                    <span className="font-display text-sm font-semibold">
                      {formatCurrency(Number(payment.amount), payment.currency)}
                    </span>
                    <StatusBadge status={payment.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No payments recorded yet.</p>
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Billed to">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{invoice.client.companyName ?? invoice.client.user.name}</p>
              <p className="text-ink-muted">{invoice.client.user.email}</p>
              <p className="text-ink-muted">
                {[invoice.client.addressLine1, invoice.client.city, invoice.client.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
              {invoice.client.taxId ? (
                <p className="text-ink-muted">Tax ID: {invoice.client.taxId}</p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Terms">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Due date</dt>
                <dd>{formatDate(invoice.dueDate)}</dd>
              </div>
              {invoice.notes ? (
                <div>
                  <dt className="text-xs text-ink-muted">Notes</dt>
                  <dd className="text-ink-muted">{invoice.notes}</dd>
                </div>
              ) : null}
              {invoice.voidReason ? (
                <div>
                  <dt className="text-xs text-ink-muted">Void reason</dt>
                  <dd className="text-danger">{invoice.voidReason}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>

          {canApprove && invoice.status !== "VOID" && Number(invoice.amountPaid) === 0 ? (
            <Panel title="Actions">
              <InvoiceActions invoiceId={invoice.id} />
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function Line({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`flex justify-between ${emphasis ? "border-t border-line pt-2 font-semibold" : ""}`}>
      <dt className={emphasis ? "" : "text-ink-muted"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
