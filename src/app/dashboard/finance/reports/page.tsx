import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MONTHS = 12;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
  });
}

export default async function ReportsPage() {
  await requirePermission("reports.read");

  const since = new Date();
  since.setMonth(since.getMonth() - (MONTHS - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [payments, expenses, byMethod, byService, receivable] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "VERIFIED", verifiedAt: { gte: since } },
      select: { amount: true, verifiedAt: true, method: true },
    }),
    prisma.expense.findMany({
      where: { status: "APPROVED", spentAt: { gte: since } },
      select: { amount: true, spentAt: true, category: true },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { status: "VERIFIED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["PAID", "PARTIALLY_PAID"] } },
      select: { amountPaid: true, items: { select: { description: true } } },
      take: 200,
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { total: true, amountPaid: true },
    }),
  ]);

  // Twelve-month income/expense series.
  const series = new Map<string, { income: number; expense: number }>();
  for (let index = 0; index < MONTHS; index += 1) {
    const date = new Date(since);
    date.setMonth(since.getMonth() + index);
    series.set(monthKey(date), { income: 0, expense: 0 });
  }
  for (const payment of payments) {
    const key = monthKey(payment.verifiedAt ?? new Date());
    const row = series.get(key);
    if (row) row.income += Number(payment.amount);
  }
  for (const expense of expenses) {
    const key = monthKey(expense.spentAt);
    const row = series.get(key);
    if (row) row.expense += Number(expense.amount);
  }

  const rows = [...series.entries()].map(([key, value]) => ({
    key,
    label: monthLabel(key),
    ...value,
    net: value.income - value.expense,
  }));

  const totalIncome = rows.reduce((sum, row) => sum + row.income, 0);
  const totalExpense = rows.reduce((sum, row) => sum + row.expense, 0);
  const peak = Math.max(1, ...rows.map((row) => Math.max(row.income, row.expense)));
  const outstanding = Number(receivable._sum.total ?? 0) - Number(receivable._sum.amountPaid ?? 0);

  const serviceRevenue = new Map<string, number>();
  for (const invoice of byService) {
    const label = invoice.items[0]?.description.split("—")[0]?.trim() ?? "Other";
    serviceRevenue.set(label, (serviceRevenue.get(label) ?? 0) + Number(invoice.amountPaid));
  }
  const topServices = [...serviceRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <>
      <DashboardHeader
        title="Financial reports"
        description={`Verified income and approved expenses over the last ${MONTHS} months.`}
        actions={
          <>
            <ButtonLink href="/api/reports/export?type=invoices" variant="outline" size="sm">
              Export invoices (CSV)
            </ButtonLink>
            <ButtonLink href="/api/reports/export?type=payments" variant="outline" size="sm">
              Export payments (CSV)
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Income (${MONTHS}m)`} value={formatCurrency(totalIncome)} icon="TrendingUp" tone="success" />
        <StatCard label={`Expenses (${MONTHS}m)`} value={formatCurrency(totalExpense)} icon="Receipt" tone="warning" />
        <StatCard
          label="Net result"
          value={formatCurrency(totalIncome - totalExpense)}
          icon="Scale"
          tone={totalIncome - totalExpense >= 0 ? "success" : "danger"}
        />
        <StatCard label="Receivable" value={formatCurrency(outstanding)} icon="Landmark" tone="info" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        {/*
          Magnitude over time, single measure per row, values printed beside the
          bars — the table is the chart, so there is nothing readable only by
          colour and no chart library in the bundle.
        */}
        <Panel title="Income and expenses by month" description="Verified payments and approved expenses only.">
          {rows.some((row) => row.income || row.expense) ? (
            <ol className="space-y-3">
              {rows.map((row) => (
                <li key={row.key} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                  <span className="space-y-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className="block h-2.5 rounded-[4px] bg-[hsl(var(--primary))]"
                        style={{ width: `${Math.max(row.income ? 2 : 0, (row.income / peak) * 100)}%` }}
                        aria-hidden
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(row.income)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className="block h-2.5 rounded-[4px] bg-[hsl(var(--primary)/0.35)]"
                        style={{ width: `${Math.max(row.expense ? 2 : 0, (row.expense / peak) * 100)}%` }}
                        aria-hidden
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(row.expense)}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      row.net >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {row.net >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(row.net))}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon="BarChart3" title="No financial activity in this period" />
          )}
          <p className="mt-5 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-[4px] bg-[hsl(var(--primary))]" aria-hidden />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-[4px] bg-[hsl(var(--primary)/0.35)]" aria-hidden />
              Expenses
            </span>
            <span>Right column: net result for the month.</span>
          </p>
        </Panel>

        <div className="space-y-5">
          <Panel title="Revenue by payment method">
            {byMethod.length ? (
              <TableWrap className="border-0">
                <Table className="min-w-full">
                  <thead>
                    <tr>
                      <Th>Method</Th>
                      <Th className="text-right">Payments</Th>
                      <Th className="text-right">Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {byMethod.map((row) => (
                      <Tr key={row.method}>
                        <Td>{row.method.replace(/_/g, " ")}</Td>
                        <Td className="text-right text-muted-foreground">{row._count}</Td>
                        <Td className="text-right font-medium">
                          {formatCurrency(Number(row._sum.amount ?? 0))}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            ) : (
              <EmptyState icon="CreditCard" title="No verified payments yet" />
            )}
          </Panel>

          <Panel title="Revenue by service line" description="Derived from the first line item on settled invoices.">
            {topServices.length ? (
              <ul className="space-y-2.5">
                {topServices.map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{label}</span>
                    <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="Layers" title="No settled invoices yet" />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
