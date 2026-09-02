import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await requirePermission("finance.read");

  const accounts = await prisma.account.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  const balances = await Promise.all(
    accounts.map(async (account) => {
      const [income, outgoing] = await Promise.all([
        prisma.transaction.aggregate({
          where: { accountId: account.id, type: "INCOME" },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { accountId: account.id, type: { in: ["EXPENSE", "REFUND"] } },
          _sum: { amount: true },
        }),
      ]);
      return {
        id: account.id,
        balance: Number(income._sum.amount ?? 0) - Number(outgoing._sum.amount ?? 0),
      };
    }),
  );

  const balanceById = new Map(balances.map((row) => [row.id, row.balance]));

  return (
    <>
      <DashboardHeader
        title="Accounts"
        description="Bank, wallet and cash accounts. Balances are derived from the transaction ledger, not stored independently."
      />

      <Panel>
        {accounts.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[40rem]">
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th>Type</Th>
                  <Th>Currency</Th>
                  <Th>Transactions</Th>
                  <Th className="text-right">Derived balance</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <Tr key={account.id}>
                    <Td className="font-medium">{account.name}</Td>
                    <Td className="text-ink-muted">{account.type.replace(/_/g, " ")}</Td>
                    <Td className="text-ink-muted">{account.currency}</Td>
                    <Td className="text-ink-muted">{account._count.transactions}</Td>
                    <Td className="text-right font-semibold">
                      {formatCurrency(balanceById.get(account.id) ?? 0, account.currency)}
                    </Td>
                    <Td>
                      <StatusBadge status={account.isActive ? "ACTIVE" : "DISABLED"} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState icon="Landmark" title="No accounts configured" description="Run the seed, or add accounts to your database." />
        )}
      </Panel>
    </>
  );
}
