import { DashboardHeader, StatCard } from "@/components/dashboard/page-shell";
import { ListFilters } from "@/components/dashboard/filters";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;
const STATUSES = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requirePermission("finance.read");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));
  const search = query.q?.trim();

  const where = {
    ...(query.status && (STATUSES as readonly string[]).includes(query.status)
      ? { status: query.status as (typeof STATUSES)[number] }
      : {}),
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: "insensitive" as const } },
            { client: { companyName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [invoices, total, totals] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        amountPaid: true,
        currency: true,
        issueDate: true,
        dueDate: true,
        client: { select: { id: true, companyName: true } },
      },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { total: true, amountPaid: true },
      _count: true,
    }),
  ]);

  const receivable = Number(totals._sum.total ?? 0) - Number(totals._sum.amountPaid ?? 0);

  return (
    <>
      <DashboardHeader
        title="Invoices"
        description="Issue, track and settle client invoices. History is never deleted — only voided or adjusted."
        actions={
          can(toActor(user), "invoice.issue") ? (
            <ButtonLink href="/dashboard/finance/invoices/new" size="sm">
              New invoice
            </ButtonLink>
          ) : null
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open invoices" value={totals._count} icon="FileText" />
        <StatCard label="Receivable" value={formatCurrency(receivable)} icon="Landmark" tone="warning" />
        <StatCard label="Total invoices" value={total} icon="Layers" tone="info" />
      </div>

      <ListFilters
        placeholder="Search invoice number or client…"
        statuses={STATUSES.map((status) => ({
          value: status,
          label: status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        }))}
      />

      {invoices.length ? (
        <>
          <TableWrap>
            <Table className="min-w-[56rem]">
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Client</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th>Total</Th>
                  <Th>Paid</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <Tr key={invoice.id}>
                    <Td>
                      <LinkCell href={`/dashboard/finance/invoices/${invoice.id}`}>{invoice.number}</LinkCell>
                    </Td>
                    <Td className="text-muted-foreground">{invoice.client.companyName ?? "—"}</Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatDate(invoice.issueDate)}</Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatDate(invoice.dueDate)}</Td>
                    <Td className="font-medium">{formatCurrency(Number(invoice.total), invoice.currency)}</Td>
                    <Td className="text-muted-foreground">
                      {formatCurrency(Number(invoice.amountPaid), invoice.currency)}
                    </Td>
                    <Td>
                      <StatusBadge status={invoice.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <Pagination
            page={page}
            pageCount={Math.ceil(total / PAGE_SIZE)}
            basePath="/dashboard/finance/invoices"
            searchParams={query}
          />
        </>
      ) : (
        <EmptyState
          icon="FileText"
          title="No invoices match those filters"
          action={{ label: "Create an invoice", href: "/dashboard/finance/invoices/new" }}
        />
      )}
    </>
  );
}
