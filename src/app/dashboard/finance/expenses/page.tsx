import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { ExpenseForm, ExpenseDecision } from "@/components/dashboard/expense-forms";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requirePermission("expense.manage");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));
  const canApprove = can(toActor(user), "finance.approve");

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [expenses, total, approved, submitted] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { spentAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
    }),
    prisma.expense.count(),
    prisma.expense.aggregate({
      where: { status: "APPROVED", spentAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.expense.count({ where: { status: "SUBMITTED" } }),
  ]);

  return (
    <>
      <DashboardHeader title="Expenses" description="Operating costs, with an approval step before they hit the ledger." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Approved this month" value={formatCurrency(Number(approved._sum.amount ?? 0))} icon="Receipt" tone="warning" />
        <StatCard label="Awaiting approval" value={submitted} icon="Clock" tone={submitted ? "info" : "success"} />
        <StatCard label="Records" value={total} icon="Layers" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <Panel title="Expense records">
          {expenses.length ? (
            <>
              <TableWrap className="border-0">
                <Table className="min-w-[48rem]">
                  <thead>
                    <tr>
                      <Th>Reference</Th>
                      <Th>Category</Th>
                      <Th>Vendor</Th>
                      <Th>Date</Th>
                      <Th className="text-right">Amount</Th>
                      <Th>Status</Th>
                      {canApprove ? <Th /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <Tr key={expense.id}>
                        <Td className="font-mono text-xs">{expense.reference}</Td>
                        <Td>{expense.category}</Td>
                        <Td className="text-muted-foreground">{expense.vendor ?? "—"}</Td>
                        <Td className="whitespace-nowrap text-muted-foreground">{formatDate(expense.spentAt)}</Td>
                        <Td className="text-right font-medium">
                          {formatCurrency(Number(expense.amount), expense.currency)}
                        </Td>
                        <Td>
                          <StatusBadge status={expense.status} />
                        </Td>
                        {canApprove ? (
                          <Td>
                            {expense.status === "SUBMITTED" ? (
                              <ExpenseDecision expenseId={expense.id} />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {expense.approvedBy?.name ?? "—"}
                              </span>
                            )}
                          </Td>
                        ) : null}
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
              <Pagination
                page={page}
                pageCount={Math.ceil(total / PAGE_SIZE)}
                basePath="/dashboard/finance/expenses"
                searchParams={query}
              />
            </>
          ) : (
            <EmptyState icon="Receipt" title="No expenses recorded" />
          )}
        </Panel>

        <Panel title="Record an expense">
          <ExpenseForm />
        </Panel>
      </div>
    </>
  );
}
