import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { LeadWorkflow } from "@/components/dashboard/lead-workflow";
import { StatusBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("leads.read");
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      service: { select: { title: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!lead) notFound();

  const owners = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"] }, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const editable = can(toActor(user), "leads.manage");

  return (
    <>
      <DashboardHeader
        title={lead.name}
        description={`${lead.reference} · received ${formatDate(lead.createdAt, true)} via ${lead.source}`}
        breadcrumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: lead.reference }]}
        actions={<StatusBadge status={lead.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <Panel title="The enquiry">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {lead.message}
            </p>
          </Panel>

          <Panel title="Notes" description="Internal only — never visible to the client.">
            {editable ? <LeadWorkflow leadId={lead.id} owners={owners} lead={{ status: lead.status, ownerId: lead.ownerId }} /> : null}

            {lead.notes.length ? (
              <ul className="mt-6 space-y-4">
                {lead.notes.map((note) => (
                  <li key={note.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">{note.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {note.author?.name ?? "System"} · {relativeTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">No notes yet.</p>
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Contact">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd>
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    {lead.email}
                  </a>
                </dd>
              </div>
              {lead.phone ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd>
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">Company</dt>
                <dd>{lead.company ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Interested in</dt>
                <dd>{lead.service?.title ?? "General enquiry"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Budget</dt>
                <dd>{lead.budget ?? "Not stated"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd>{lead.owner?.name ?? "Unassigned"}</dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </>
  );
}
