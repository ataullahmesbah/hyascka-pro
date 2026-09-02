import { DashboardHeader } from "@/components/dashboard/page-shell";
import { ListFilters } from "@/components/dashboard/filters";
import { EmptyState, LinkCell, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("clients.read");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));
  const search = query.q?.trim();

  // A PROJECT_MANAGER only ever sees the clients it is assigned to (PRD §42.5).
  const scope =
    user.role === "PROJECT_MANAGER"
      ? { projects: { some: { members: { some: { userId: user.id } } } } }
      : {};

  const where = {
    ...scope,
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.clientProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        companyName: true,
        city: true,
        country: true,
        createdAt: true,
        user: { select: { name: true, email: true, status: true } },
        _count: { select: { projects: true, invoices: true } },
        invoices: {
          where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
          select: { total: true, amountPaid: true, currency: true },
        },
      },
    }),
    prisma.clientProfile.count({ where }),
  ]);

  return (
    <>
      <DashboardHeader title="Clients" description="Accounts, delivery volume and outstanding balances." />
      <ListFilters placeholder="Search company, name or email…" />

      {clients.length ? (
        <>
          <TableWrap>
            <Table className="min-w-[52rem]">
              <thead>
                <tr>
                  <Th>Company</Th>
                  <Th>Primary contact</Th>
                  <Th>Location</Th>
                  <Th>Projects</Th>
                  <Th>Outstanding</Th>
                  <Th>Client since</Th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const outstanding = client.invoices.reduce(
                    (sum, invoice) => sum + Number(invoice.total) - Number(invoice.amountPaid),
                    0,
                  );
                  return (
                    <Tr key={client.id}>
                      <Td>
                        <LinkCell href={`/dashboard/clients/${client.id}`}>
                          {client.companyName ?? client.user.name}
                        </LinkCell>
                      </Td>
                      <Td>
                        <p className="text-sm">{client.user.name}</p>
                        <p className="text-xs text-ink-muted">{client.user.email}</p>
                      </Td>
                      <Td className="text-ink-muted">
                        {[client.city, client.country].filter(Boolean).join(", ") || "—"}
                      </Td>
                      <Td className="text-ink-muted">
                        {client._count.projects} · {client._count.invoices} invoices
                      </Td>
                      <Td className={outstanding > 0 ? "font-semibold text-warning" : "text-ink-muted"}>
                        {formatCurrency(outstanding)}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">{formatDate(client.createdAt)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
          <Pagination
            page={page}
            pageCount={Math.ceil(total / PAGE_SIZE)}
            basePath="/dashboard/clients"
            searchParams={query}
          />
        </>
      ) : (
        <EmptyState
          icon="Users"
          title="No clients yet"
          description="Convert a qualified lead to create the first client account."
          action={{ label: "Open leads", href: "/dashboard/leads" }}
        />
      )}
    </>
  );
}
