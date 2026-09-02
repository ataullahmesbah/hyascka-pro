import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/page-shell";
import { ListFilters } from "@/components/dashboard/filters";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requirePermission("leads.read");
  const query = await searchParams;

  return (
    <>
      <DashboardHeader
        title="Leads & CRM"
        description="Every website enquiry, with its source, owner and pipeline stage."
      />
      <ListFilters
        placeholder="Search name, email or company…"
        statuses={STATUSES.map((status) => ({
          value: status,
          label: status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        }))}
      />
      <Suspense fallback={<TableSkeleton />}>
        <LeadsTable query={query} />
      </Suspense>
    </>
  );
}

async function LeadsTable({ query }: { query: { q?: string; status?: string; page?: string } }) {
  const page = Math.max(1, Number(query.page ?? 1));
  const search = query.q?.trim();

  const where = {
    ...(query.status && (STATUSES as readonly string[]).includes(query.status)
      ? { status: query.status as (typeof STATUSES)[number] }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { company: { contains: search, mode: "insensitive" as const } },
            { reference: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        name: true,
        email: true,
        company: true,
        budget: true,
        status: true,
        source: true,
        createdAt: true,
        owner: { select: { name: true } },
        service: { select: { title: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  if (!leads.length) {
    return (
      <EmptyState
        icon="UserPlus"
        title="No leads match those filters"
        description="Website enquiries appear here the moment they are submitted."
      />
    );
  }

  return (
    <>
      <TableWrap>
        <Table className="min-w-[60rem]">
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Contact</Th>
              <Th>Company</Th>
              <Th>Interest</Th>
              <Th>Budget</Th>
              <Th>Owner</Th>
              <Th>Status</Th>
              <Th>Received</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <Tr key={lead.id}>
                <Td className="font-mono text-xs text-ink-muted">{lead.reference}</Td>
                <Td>
                  <LinkCell href={`/dashboard/leads/${lead.id}`}>{lead.name}</LinkCell>
                  <p className="text-xs text-ink-muted">{lead.email}</p>
                </Td>
                <Td className="text-ink-muted">{lead.company ?? "—"}</Td>
                <Td className="text-ink-muted">{lead.service?.title ?? "General"}</Td>
                <Td className="text-ink-muted">{lead.budget ?? "—"}</Td>
                <Td className="text-ink-muted">{lead.owner?.name ?? "Unassigned"}</Td>
                <Td>
                  <StatusBadge status={lead.status} />
                </Td>
                <Td className="whitespace-nowrap text-ink-muted">{formatDate(lead.createdAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
      <Pagination
        page={page}
        pageCount={Math.ceil(total / PAGE_SIZE)}
        basePath="/dashboard/leads"
        searchParams={query}
      />
    </>
  );
}
