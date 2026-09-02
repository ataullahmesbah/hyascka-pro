import { notFound, redirect } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { TicketAssign, TicketReply, TicketStatusControl } from "@/components/dashboard/ticket-forms";
import { ROLE_LABELS } from "@/lib/rbac";
import { StatusBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { canAccessTicket, requireUser, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { initials, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  if (!(await canAccessTicket(user, id))) redirect("/dashboard?denied=1");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      client: { select: { companyName: true, user: { select: { name: true, email: true } } } },
      assignee: { select: { id: true, name: true } },
      messages: {
        where: user.role === "CLIENT" ? { isInternal: false } : {},
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
    },
  });
  if (!ticket) notFound();

  const isStaff = user.role !== "CLIENT";
  const canManage = isStaff && can(toActor(user), "support.manage");

  const staff = canManage
    ? await prisma.user.findMany({
        where: { role: { not: "CLIENT" }, status: "ACTIVE" },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <>
      <DashboardHeader
        title={ticket.subject}
        description={`${ticket.reference} · ${ticket.client.companyName ?? ticket.client.user.name}`}
        breadcrumbs={[{ label: "Support", href: "/dashboard/support" }, { label: ticket.reference }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <Panel title="Conversation">
          <ul className="space-y-4">
            {ticket.messages.map((message) => (
              <li key={message.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-ink-muted">
                  {initials(message.author.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={
                      message.isInternal
                        ? "rounded-xl border border-warning/40 bg-warning/10 p-3.5"
                        : "rounded-xl bg-surface-2/60 p-3.5"
                    }
                  >
                    {message.isInternal ? (
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-warning">
                        Internal note
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {message.author.name} · {relativeTime(message.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-line pt-5">
            <TicketReply ticketId={ticket.id} canPostInternal={canManage} />
          </div>
        </Panel>

        <aside className="space-y-5">
          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Category</dt>
                <dd>{ticket.category}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Assigned to</dt>
                <dd>{ticket.assignee?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Contact</dt>
                <dd>{ticket.client.user.email}</dd>
              </div>
            </dl>
          </Panel>

          {canManage ? (
            <>
              <Panel title="Status">
                <TicketStatusControl ticketId={ticket.id} status={ticket.status} />
              </Panel>
              <Panel title="Assignment" description="Pass this to someone else on the team.">
                <TicketAssign
                  ticketId={ticket.id}
                  currentAssigneeId={ticket.assigneeId}
                  staff={staff.map((member) => ({
                    id: member.id,
                    name: member.name,
                    roleLabel: ROLE_LABELS[member.role],
                  }))}
                />
              </Panel>
            </>
          ) : null}
        </aside>
      </div>
    </>
  );
}
