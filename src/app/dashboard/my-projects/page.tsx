import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyProjectsPage() {
  const { clientId } = await requireClient();

  const projects = await prisma.project.findMany({
    where: { clientId },
    orderBy: { updatedAt: "desc" },
    include: { milestones: { orderBy: { position: "asc" } }, service: { select: { title: true } } },
  });

  return (
    <>
      <DashboardHeader title="Projects" description="Live status of everything we are building for you." />

      {projects.length ? (
        <div className="space-y-5">
          {projects.map((project) => (
            <Panel
              key={project.id}
              title={project.name}
              description={project.service?.title ?? undefined}
              action={<StatusBadge status={project.status} />}
            >
              <div className="mb-5">
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {project.progress}% complete
                  {project.dueDate ? ` · target ${formatDate(project.dueDate)}` : ""}
                </p>
              </div>

              {/* Visual timeline rather than a flat milestone list (PRD §48.2) */}
              <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {project.milestones.map((milestone) => (
                  <li key={milestone.id} className="rounded-lg border border-line p-4">
                    <StatusBadge status={milestone.status} />
                    <p className="mt-2 text-sm font-medium">{milestone.title}</p>
                    {milestone.dueDate ? (
                      <p className="mt-1 text-xs text-ink-muted">{formatDate(milestone.dueDate)}</p>
                    ) : null}
                  </li>
                ))}
              </ol>

              <div className="mt-5">
                <LinkCell href={`/dashboard/my-projects/${project.id}`}>Open project detail →</LinkCell>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="FolderKanban"
          title="No projects yet"
          description="Once an engagement starts, its progress appears here."
        />
      )}
    </>
  );
}
