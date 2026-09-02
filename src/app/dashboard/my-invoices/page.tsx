import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyInvoicesPage() {
  const { clientId } = await requireClient();

  const invoices = await prisma.invoice.findMany({
    where: { clientId, status: { not: "DRAFT" } },
    orderBy: { issueDate: "desc" },
  });

  const outstanding = invoices.reduce(
    (sum, invoice) =>
      ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)
        ? sum + Number(invoice.total) - Number(invoice.amountPaid)
        : sum,
    0,
  );
  const overdue = invoices.filter((invoice) => invoice.status === "OVERDUE").length;

  return (
    <>
      <DashboardHeader title="Invoices" description="Every invoice issued to your account, with its payment status." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          icon="Wallet"
          tone={outstanding > 0 ? "warning" : "success"}
        />
        <StatCard label="Overdue" value={overdue} icon="AlertTriangle" tone={overdue ? "danger" : "success"} />
        <StatCard label="Invoices" value={invoices.length} icon="FileText" tone="info" />
      </div>

      <Panel>
        {invoices.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[40rem]">
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th>Total</Th>
                  <Th>Outstanding</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const due = Number(invoice.total) - Number(invoice.amountPaid);
                  return (
                    <Tr key={invoice.id}>
                      <Td>
                        <LinkCell href={`/dashboard/my-invoices/${invoice.id}`}>{invoice.number}</LinkCell>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">{formatDate(invoice.issueDate)}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">{formatDate(invoice.dueDate)}</Td>
                      <Td className="font-medium">{formatCurrency(Number(invoice.total), invoice.currency)}</Td>
                      <Td className={due > 0 ? "font-semibold text-warning" : "text-ink-muted"}>
                        {formatCurrency(due, invoice.currency)}
                      </Td>
                      <Td>
                        <StatusBadge status={invoice.status} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState icon="FileText" title="No invoices yet" description="Invoices we issue will appear here." />
        )}
      </Panel>
    </>
  );
}
