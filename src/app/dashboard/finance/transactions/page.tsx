import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("finance.read");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { account: { select: { name: true } } },
    }),
    prisma.transaction.count(),
  ]);

  return (
    <>
      <DashboardHeader
        title="Transactions"
        description="The append-only ledger. Entries are created by verified payments, approved expenses and refunds — never edited by hand."
      />

      <Panel>
        {transactions.length ? (
          <>
            <TableWrap className="border-0">
              <Table className="min-w-[48rem]">
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Account</Th>
                    <Th>Description</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td className="font-mono text-xs">{transaction.reference}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(transaction.occurredAt)}
                      </Td>
                      <Td>
                        <StatusBadge
                          status={transaction.type === "INCOME" ? "PAID" : transaction.type}
                        />
                      </Td>
                      <Td className="text-ink-muted">{transaction.account?.name ?? "—"}</Td>
                      <Td className="text-ink-muted">{transaction.description}</Td>
                      <Td
                        className={`text-right font-medium ${
                          transaction.type === "INCOME" ? "text-success" : "text-danger"
                        }`}
                      >
                        {transaction.type === "INCOME" ? "+" : "−"}
                        {formatCurrency(Number(transaction.amount), transaction.currency)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <Pagination
              page={page}
              pageCount={Math.ceil(total / PAGE_SIZE)}
              basePath="/dashboard/finance/transactions"
              searchParams={query}
            />
          </>
        ) : (
          <EmptyState icon="ArrowLeftRight" title="No ledger entries yet" />
        )}
      </Panel>
    </>
  );
}
