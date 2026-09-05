import { notFound } from "next/navigation";

import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { TicketForm } from "@/components/dashboard/ticket-forms";
import { StatusBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { clientId } = await requireClient();
  const { id } = await params;

  // Scoped by clientId in the query itself — another client's project id
  // simply does not resolve (PRD §41.4).
  const project = await prisma.project.findFirst({
    where: { id, clientId },
    include: {
      service: { select: { title: true } },
      milestones: { orderBy: { position: "asc" } },
      files: { where: { visibleToClient: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 15, include: { actor: { select: { name: true } } } },
    },
  });
  if (!project) notFound();

  const doneMilestones = project.milestones.filter((m) => m.status === "COMPLETED").length;

  return (
    <>
      <DashboardHeader
        title={project.name}
        description={project.summary ?? project.service?.title ?? undefined}
        breadcrumbs={[{ label: "Projects", href: "/dashboard/my-projects" }, { label: project.name }]}
        actions={<StatusBadge status={project.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Progress" value={`${project.progress}%`} icon="Activity" />
        <StatCard
          label="Milestones complete"
          value={`${doneMilestones}/${project.milestones.length}`}
          icon="Flag"
          tone="info"
        />
        <StatCard label="Started" value={formatDate(project.startDate)} icon="CalendarDays" />
        <StatCard label="Target date" value={formatDate(project.dueDate)} icon="Target" tone="warning" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Panel title="Timeline">
          <ol className="relative space-y-5 border-l border-line pl-6">
            {project.milestones.map((milestone) => (
              <li key={milestone.id}>
                <span
                  className={`absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-bg ${
                    milestone.status === "COMPLETED"
                      ? "bg-success"
                      : milestone.status === "IN_PROGRESS"
                        ? "bg-accent"
                        : "bg-surface-2"
                  }`}
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{milestone.title}</p>
                  <StatusBadge status={milestone.status} />
                </div>
                {milestone.detail ? (
                  <p className="mt-1 text-sm text-ink-muted">{milestone.detail}</p>
                ) : null}
                {milestone.dueDate ? (
                  <p className="mt-1 text-xs text-ink-muted">{formatDate(milestone.dueDate)}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </Panel>

        <aside className="space-y-5">
          <Panel
            title="Something wrong?"
            description="Raise a ticket and it arrives already attached to this project."
          >
            <TicketForm projectId={project.id} aboutTitle={project.name} />
          </Panel>

          <Panel title="Shared files">
            {project.files.length ? (
              <ul className="space-y-2.5">
                {project.files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No files shared yet.</p>
            )}
          </Panel>

          <Panel title="Recent updates">
            <ul className="space-y-3">
              {project.activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <p className="text-ink-muted">{activity.detail ?? activity.action}</p>
                  <p className="text-xs text-ink-muted">
                    {activity.actor?.name ?? "HYASCKA"} · {relativeTime(activity.createdAt)}
                  </p>
                </li>
              ))}
              {!project.activities.length ? (
                <p className="text-sm text-ink-muted">No updates yet.</p>
              ) : null}
            </ul>
          </Panel>
        </aside>
      </div>
    </>
  );
}
