import { DashboardHeader } from "@/components/dashboard/page-shell";
import { ListFilters } from "@/components/dashboard/filters";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Pagination, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;
const STATUSES = ["PLANNING", "IN_PROGRESS", "REVIEW", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requirePermission("projects.read");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1));
  const search = query.q?.trim();

  const scope =
    user.role === "PROJECT_MANAGER" ? { members: { some: { userId: user.id } } } : {};

  const where = {
    ...scope,
    ...(query.status && (STATUSES as readonly string[]).includes(query.status)
      ? { status: query.status as (typeof STATUSES)[number] }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { reference: { contains: search, mode: "insensitive" as const } },
            { client: { companyName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        name: true,
        status: true,
        progress: true,
        dueDate: true,
        budget: true,
        currency: true,
        client: { select: { id: true, companyName: true } },
        _count: { select: { tasks: true, milestones: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Projects"
        description={
          user.role === "PROJECT_MANAGER"
            ? "Projects you are assigned to."
            : "Delivery across every client engagement."
        }
      />
      <ListFilters
        placeholder="Search project, reference or client…"
        statuses={STATUSES.map((status) => ({
          value: status,
          label: status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        }))}
      />

      {projects.length ? (
        <>
          <TableWrap>
            <Table className="min-w-[56rem]">
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Client</Th>
                  <Th>Progress</Th>
                  <Th>Due</Th>
                  <Th>Budget</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <Tr key={project.id}>
                    <Td>
                      <LinkCell href={`/dashboard/projects/${project.id}`}>{project.name}</LinkCell>
                      <p className="font-mono text-xs text-ink-muted">{project.reference}</p>
                    </Td>
                    <Td className="text-ink-muted">{project.client.companyName ?? "—"}</Td>
                    <Td>
                      <div className="w-32">
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-ink-muted">
                          {project.progress}% · {project._count.tasks} tasks
                        </p>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">{formatDate(project.dueDate)}</Td>
                    <Td className="text-ink-muted">
                      {project.budget ? formatCurrency(Number(project.budget), project.currency) : "—"}
                    </Td>
                    <Td>
                      <StatusBadge status={project.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <Pagination
            page={page}
            pageCount={Math.ceil(total / PAGE_SIZE)}
            basePath="/dashboard/projects"
            searchParams={query}
          />
        </>
      ) : (
        <EmptyState icon="FolderKanban" title="No projects match those filters" />
      )}
    </>
  );
}
