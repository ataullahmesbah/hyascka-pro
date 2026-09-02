import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { PaymentDecision } from "@/components/dashboard/payment-decision";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requirePermission("finance.read");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));
  const canVerify = can(toActor(user), "payment.verify");

  const [pending, history, total, verifiedSum] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PENDING_VERIFICATION" },
      orderBy: { createdAt: "asc" },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            total: true,
            amountPaid: true,
            client: { select: { companyName: true } },
          },
        },
        submittedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: { not: "PENDING_VERIFICATION" } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        invoice: { select: { id: true, number: true, client: { select: { companyName: true } } } },
        verifiedBy: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where: { status: { not: "PENDING_VERIFICATION" } } }),
    prisma.payment.aggregate({ where: { status: "VERIFIED" }, _sum: { amount: true } }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Payments"
        description="Manual submissions are verified here. Every decision is written to the audit log."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting verification"
          value={pending.length}
          icon="Clock"
          tone={pending.length ? "warning" : "success"}
        />
        <StatCard label="Verified total" value={formatCurrency(Number(verifiedSum._sum.amount ?? 0))} icon="CheckCircle2" tone="success" />
        <StatCard label="Payment records" value={total + pending.length} icon="CreditCard" tone="info" />
      </div>

      <Panel
        title="Verification queue"
        description={
          canVerify
            ? "Match the transaction ID against your bank or wallet statement before verifying."
            : "Read-only — verification requires the payment.verify permission."
        }
        className="mb-6"
      >
        {pending.length ? (
          <ul className="space-y-4">
            {pending.map((payment) => (
              <li key={payment.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold">
                      {formatCurrency(Number(payment.amount), payment.currency)} ·{" "}
                      {payment.method.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {payment.invoice.client.companyName ?? "Client"} ·{" "}
                      <LinkCell href={`/dashboard/finance/invoices/${payment.invoice.id}`}>
                        {payment.invoice.number}
                      </LinkCell>
                    </p>
                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-ink-muted sm:grid-cols-2">
                      <div>
                        <dt className="inline font-medium">Transaction ID: </dt>
                        <dd className="inline font-mono">{payment.trxId ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">Sender: </dt>
                        <dd className="inline">{payment.senderNumber ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">Submitted: </dt>
                        <dd className="inline">{formatDate(payment.createdAt, true)}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">By: </dt>
                        <dd className="inline">{payment.submittedBy?.name ?? "—"}</dd>
                      </div>
                    </dl>
                    {payment.proofUrl ? (
                      <a
                        href={payment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-accent hover:underline"
                      >
                        View submitted receipt
                      </a>
                    ) : null}
                  </div>

                  {canVerify ? <PaymentDecision paymentId={payment.id} /> : <StatusBadge status={payment.status} />}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="CheckCircle2" title="Queue is clear" description="No payments are waiting for verification." />
        )}
      </Panel>

      <Panel title="Payment history">
        {history.length ? (
          <>
            <TableWrap className="border-0">
              <Table className="min-w-[52rem]">
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Client</Th>
                    <Th>Invoice</Th>
                    <Th>Method</Th>
                    <Th>Amount</Th>
                    <Th>Decided by</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payment) => (
                    <Tr key={payment.id}>
                      <Td className="font-mono text-xs">{payment.reference}</Td>
                      <Td className="text-ink-muted">
                        {payment.invoice.client.companyName ?? "—"}
                      </Td>
                      <Td>
                        <LinkCell href={`/dashboard/finance/invoices/${payment.invoice.id}`}>
                          {payment.invoice.number}
                        </LinkCell>
                      </Td>
                      <Td className="text-ink-muted">{payment.method.replace(/_/g, " ")}</Td>
                      <Td className="font-medium">
                        {formatCurrency(Number(payment.amount), payment.currency)}
                      </Td>
                      <Td className="text-ink-muted">{payment.verifiedBy?.name ?? "—"}</Td>
                      <Td>
                        <StatusBadge status={payment.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <Pagination
              page={page}
              pageCount={Math.ceil(total / PAGE_SIZE)}
              basePath="/dashboard/finance/payments"
              searchParams={query}
            />
          </>
        ) : (
          <EmptyState icon="CreditCard" title="No decided payments yet" />
        )}
      </Panel>
    </>
  );
}
