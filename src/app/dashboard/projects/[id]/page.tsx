import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { ProjectControls, TaskList } from "@/components/dashboard/project-controls";
import { StatusBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { canAccessProject, requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("projects.read");
  const { id } = await params;

  if (!(await canAccessProject(user, id))) redirect("/dashboard?denied=1");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
      service: { select: { title: true } },
      members: { select: { roleLabel: true, user: { select: { name: true } } } },
      milestones: { orderBy: { position: "asc" } },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }], include: { assignee: { select: { name: true } } } },
      files: { orderBy: { createdAt: "desc" } },
      tickets: {
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, subject: true, status: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!project) notFound();

  const manageable = can(toActor(user), "projects.manage");
  const done = project.tasks.filter((task) => task.status === "DONE").length;

  return (
    <>
      <DashboardHeader
        title={project.name}
        description={`${project.reference} · ${project.client.companyName ?? project.client.user.name}`}
        breadcrumbs={[{ label: "Projects", href: "/dashboard/projects" }, { label: project.reference }]}
        actions={<StatusBadge status={project.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Progress" value={`${project.progress}%`} icon="Activity" />
        <StatCard label="Tasks done" value={`${done}/${project.tasks.length}`} icon="ListChecks" tone="info" />
        <StatCard label="Due date" value={formatDate(project.dueDate)} icon="CalendarDays" tone="warning" />
        <StatCard
          label="Budget"
          value={project.budget ? formatCurrency(Number(project.budget), project.currency) : "—"}
          icon="Wallet"
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {manageable ? (
            <Panel title="Update delivery status" description="The client is notified whenever this changes.">
              <ProjectControls projectId={project.id} status={project.status} progress={project.progress} />
            </Panel>
          ) : null}

          <Panel title="Milestones">
            <ol className="space-y-3">
              {project.milestones.map((milestone) => (
                <li key={milestone.id} className="flex items-center gap-3 rounded-lg border border-line p-4">
                  <StatusBadge status={milestone.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{milestone.title}</p>
                    {milestone.detail ? (
                      <p className="text-xs text-ink-muted">{milestone.detail}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-ink-muted">{formatDate(milestone.dueDate)}</span>
                </li>
              ))}
              {!project.milestones.length ? (
                <p className="text-sm text-ink-muted">No milestones defined.</p>
              ) : null}
            </ol>
          </Panel>

          <Panel title="Tasks">
            <TaskList
              editable={manageable}
              tasks={project.tasks.map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee?.name ?? null,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
              }))}
            />
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Team">
            <ul className="space-y-3">
              {project.members.map((member) => (
                <li key={member.user.name} className="flex items-center justify-between gap-3 text-sm">
                  <span>{member.user.name}</span>
                  <span className="text-xs text-ink-muted">{member.roleLabel}</span>
                </li>
              ))}
              {!project.members.length ? (
                <p className="text-sm text-ink-muted">No team members assigned.</p>
              ) : null}
            </ul>
          </Panel>

          <Panel title="Files">
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
              <p className="text-sm text-ink-muted">No files uploaded.</p>
            )}
          </Panel>

          {project.tickets.length ? (
            <Panel title={`Tickets about this (${project.tickets.length})`}>
              <ul className="space-y-2">
                {project.tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/dashboard/support/${ticket.id}`}
                      className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-step--1">{ticket.subject}</span>
                      <StatusBadge status={ticket.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Activity">
            <ul className="space-y-3">
              {project.activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <p className="text-ink-muted">{activity.detail ?? activity.action}</p>
                  <p className="text-xs text-ink-muted">
                    {activity.actor?.name ?? "System"} · {relativeTime(activity.createdAt)}
                  </p>
                </li>
              ))}
              {!project.activities.length ? (
                <p className="text-sm text-ink-muted">No activity recorded.</p>
              ) : null}
            </ul>
          </Panel>
        </aside>
      </div>
    </>
  );
}
