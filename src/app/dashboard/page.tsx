import Link from "next/link";

import { DashboardHeader, DeniedNotice, Panel, StatCard } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guards";
import {
  clientOverview,
  editorOverview,
  financeOverview,
  projectManagerOverview,
  staffOverview,
  supportOverview,
} from "@/lib/dashboard-data";
import { formatCurrency, formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; welcome?: string }>;
}) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);

  return (
    <>
      {query.denied ? <DeniedNotice /> : null}
      {query.welcome ? (
        <div className="mb-6 rounded-xl border border-success/35 bg-success/8 p-4 text-sm text-success">
          Your account is ready. Complete your profile so invoices carry the right billing details.
        </div>
      ) : null}

      {user.role === "CLIENT" ? (
        <ClientOverview clientProfileId={user.clientProfileId} name={user.name} />
      ) : user.role === "FINANCE" ? (
        <FinanceOverview />
      ) : user.role === "PROJECT_MANAGER" ? (
        <ProjectManagerOverview userId={user.id} />
      ) : user.role === "EDITOR" ? (
        <EditorOverview />
      ) : user.role === "SUPPORT" ? (
        <SupportOverview userId={user.id} />
      ) : (
        <AdminOverview />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

async function AdminOverview() {
  const data = await staffOverview();

  return (
    <>
      <DashboardHeader
        title="Business overview"
        description="Leads, delivery, money and system health at a glance."
        actions={
          <>
            <ButtonLink href="/dashboard/leads" variant="outline" size="sm">
              View leads
            </ButtonLink>
            <ButtonLink href="/dashboard/finance/invoices/new" size="sm">
              New invoice
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New leads" value={data.newLeads} icon="UserPlus" href="/dashboard/leads" detail="Awaiting first contact" />
        <StatCard label="Active projects" value={data.activeProjects} icon="FolderKanban" tone="info" href="/dashboard/projects" />
        <StatCard
          label="Revenue this month"
          value={formatCurrency(data.monthRevenue)}
          icon="TrendingUp"
          tone="success"
          detail="Verified payments only"
        />
        <StatCard
          label="Payments to verify"
          value={data.pendingPayments}
          icon="CreditCard"
          tone={data.pendingPayments > 0 ? "warning" : "primary"}
          href="/dashboard/finance/payments"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={data.totalClients} icon="Users" href="/dashboard/clients" />
        <StatCard
          label="Overdue invoices"
          value={data.overdueInvoices}
          icon="AlertTriangle"
          tone={data.overdueInvoices > 0 ? "danger" : "primary"}
          href="/dashboard/finance/invoices?status=OVERDUE"
        />
        <StatCard label="Open tickets" value={data.openTickets} icon="LifeBuoy" tone="info" href="/dashboard/support" />
        <StatCard label="System" value="Operational" icon="ShieldCheck" tone="success" detail="No security alerts" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel
          title="Latest enquiries"
          action={
            <Link href="/dashboard/leads" className="text-sm font-medium text-primary hover:underline">
              All leads
            </Link>
          }
        >
          {data.recentLeads.length ? (
            <TableWrap className="border-0">
              <Table className="min-w-[32rem]">
                <thead>
                  <tr>
                    <Th>Lead</Th>
                    <Th>Company</Th>
                    <Th>Status</Th>
                    <Th>Received</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLeads.map((lead) => (
                    <Tr key={lead.id}>
                      <Td>
                        <LinkCell href={`/dashboard/leads/${lead.id}`}>{lead.name}</LinkCell>
                      </Td>
                      <Td className="text-muted-foreground">{lead.company ?? "—"}</Td>
                      <Td>
                        <StatusBadge status={lead.status} />
                      </Td>
                      <Td className="text-muted-foreground">{relativeTime(lead.createdAt)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState icon="UserPlus" title="No enquiries yet" description="New website enquiries land here." />
          )}
        </Panel>

        <Panel
          title="Recent payments"
          action={
            <Link href="/dashboard/finance/payments" className="text-sm font-medium text-primary hover:underline">
              All payments
            </Link>
          }
        >
          {data.recentPayments.length ? (
            <TableWrap className="border-0">
              <Table className="min-w-[32rem]">
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Client</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((payment) => (
                    <Tr key={payment.id}>
                      <Td className="whitespace-nowrap">
                        <LinkCell href="/dashboard/finance/payments">{payment.reference}</LinkCell>
                        <p className="text-xs text-muted-foreground">{payment.invoice.number}</p>
                      </Td>
                      <Td className="text-muted-foreground">
                        {payment.invoice.client.companyName ?? "—"}
                      </Td>
                      <Td className="font-medium">
                        {formatCurrency(Number(payment.amount), payment.currency)}
                      </Td>
                      <Td>
                        <StatusBadge status={payment.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState icon="CreditCard" title="No payments recorded" />
          )}
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="Projects approaching a deadline">
          {data.projectsDueSoon.length ? (
            <ul className="divide-y divide-border">
              {data.projectsDueSoon.map((project) => (
                <li key={project.id} className="flex flex-wrap items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <LinkCell href={`/dashboard/projects/${project.id}`}>{project.name}</LinkCell>
                    <p className="text-xs text-muted-foreground">{project.client.companyName ?? "—"}</p>
                  </div>
                  <div className="w-40">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="brand-gradient h-full rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{project.progress}% complete</p>
                  </div>
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-muted-foreground">Due {formatDate(project.dueDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="FolderKanban" title="No projects with a deadline set" />
          )}
        </Panel>
      </div>
    </>
  );
}

async function FinanceOverview() {
  const data = await financeOverview();
  const net = data.monthIncome - data.monthExpenses;

  return (
    <>
      <DashboardHeader
        title="Finance overview"
        description="Money in, money out, and what is waiting on you."
        actions={
          <ButtonLink href="/dashboard/finance/invoices/new" size="sm">
            New invoice
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income this month" value={formatCurrency(data.monthIncome)} icon="TrendingUp" tone="success" />
        <StatCard label="Expenses this month" value={formatCurrency(data.monthExpenses)} icon="Receipt" tone="warning" />
        <StatCard
          label="Net this month"
          value={formatCurrency(net)}
          icon="Scale"
          tone={net >= 0 ? "success" : "danger"}
        />
        <StatCard label="Receivable" value={formatCurrency(data.receivable)} icon="Landmark" tone="info" detail={`${data.overdueCount} overdue`} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel
          title="Awaiting verification"
          description="Manual payments submitted by clients."
          action={
            <Link href="/dashboard/finance/payments" className="text-sm font-medium text-primary hover:underline">
              Open queue
            </Link>
          }
        >
          {data.pendingPayments.length ? (
            <ul className="divide-y divide-border">
              {data.pendingPayments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {payment.invoice.client.companyName ?? "Client"} · {payment.invoice.number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.method.replace(/_/g, " ")} · TrxID {payment.trxId ?? "—"} ·{" "}
                      {relativeTime(payment.createdAt)}
                    </p>
                  </div>
                  <span className="font-display text-sm font-semibold">
                    {formatCurrency(Number(payment.amount), payment.currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="CheckCircle2" title="Queue is clear" description="No payments waiting for verification." />
          )}
        </Panel>

        <Panel
          title="Recent invoices"
          action={
            <Link href="/dashboard/finance/invoices" className="text-sm font-medium text-primary hover:underline">
              All invoices
            </Link>
          }
        >
          {data.recentInvoices.length ? (
            <TableWrap className="border-0">
              <Table className="min-w-[30rem]">
                <thead>
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Client</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map((invoice) => (
                    <Tr key={invoice.id}>
                      <Td>
                        <LinkCell href={`/dashboard/finance/invoices/${invoice.id}`}>{invoice.number}</LinkCell>
                      </Td>
                      <Td className="text-muted-foreground">{invoice.client.companyName ?? "—"}</Td>
                      <Td className="font-medium">{formatCurrency(Number(invoice.total), invoice.currency)}</Td>
                      <Td>
                        <StatusBadge status={invoice.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState icon="FileText" title="No invoices yet" action={{ label: "Create one", href: "/dashboard/finance/invoices/new" }} />
          )}
        </Panel>
      </div>
    </>
  );
}

async function ProjectManagerOverview({ userId }: { userId: string }) {
  const data = await projectManagerOverview(userId);

  return (
    <>
      <DashboardHeader title="Delivery overview" description="Only the clients and projects assigned to you." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active projects" value={data.active} icon="FolderKanban" />
        <StatCard label="My open tasks" value={data.myTasks.length} icon="ListChecks" tone="info" />
        <StatCard
          label="Overdue tasks"
          value={data.overdueTasks}
          icon="AlertTriangle"
          tone={data.overdueTasks > 0 ? "danger" : "success"}
        />
        <StatCard label="Assigned clients" value={new Set(data.projects.map((p) => p.client.companyName)).size} icon="Users" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel title="My projects">
          {data.projects.length ? (
            <ul className="divide-y divide-border">
              {data.projects.map((project) => (
                <li key={project.id} className="flex flex-wrap items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <LinkCell href={`/dashboard/projects/${project.id}`}>{project.name}</LinkCell>
                    <p className="text-xs text-muted-foreground">{project.client.companyName ?? "—"}</p>
                  </div>
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-muted-foreground">Due {formatDate(project.dueDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="FolderKanban" title="No projects assigned to you yet" />
          )}
        </Panel>

        <Panel title="My tasks">
          {data.myTasks.length ? (
            <ul className="divide-y divide-border">
              {data.myTasks.map((task) => (
                <li key={task.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project.name}</p>
                  </div>
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="ListChecks" title="Nothing assigned to you" />
          )}
        </Panel>
      </div>
    </>
  );
}

async function EditorOverview() {
  const data = await editorOverview();

  return (
    <>
      <DashboardHeader
        title="Content overview"
        description="Everything published on the public site."
        actions={
          <ButtonLink href="/dashboard/content/blog/new" size="sm">
            New article
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published articles" value={data.published} icon="Newspaper" tone="success" />
        <StatCard label="Drafts" value={data.drafts} icon="PenSquare" tone="warning" href="/dashboard/content/blog" />
        <StatCard label="Total articles" value={data.posts} icon="Library" />
        <StatCard label="Services" value={data.services} icon="Layers" href="/dashboard/services" />
      </div>

      <div className="mt-6">
        <Panel
          title="Recently edited"
          action={
            <Link href="/dashboard/content/blog" className="text-sm font-medium text-primary hover:underline">
              All articles
            </Link>
          }
        >
          {data.recentPosts.length ? (
            <ul className="divide-y divide-border">
              {data.recentPosts.map((post) => (
                <li key={post.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <LinkCell href={`/dashboard/content/blog/${post.id}`}>{post.title}</LinkCell>
                    <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                  </div>
                  <StatusBadge status={post.status} />
                  <span className="text-xs text-muted-foreground">{relativeTime(post.updatedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="Newspaper" title="No articles yet" action={{ label: "Write the first one", href: "/dashboard/content/blog/new" }} />
          )}
        </Panel>
      </div>
    </>
  );
}

async function SupportOverview({ userId }: { userId: string }) {
  const data = await supportOverview(userId);

  return (
    <>
      <DashboardHeader title="Support overview" description="Open conversations and tickets that need a reply." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open tickets" value={data.open} icon="LifeBuoy" tone="info" href="/dashboard/support" />
        <StatCard label="Assigned to me" value={data.mine} icon="UserCheck" />
        <StatCard label="Active conversations" value={data.unanswered} icon="MessageSquare" href="/dashboard/messages" />
      </div>

      <div className="mt-6">
        <Panel title="Oldest open tickets" description="Answer these first.">
          {data.tickets.length ? (
            <ul className="divide-y divide-border">
              {data.tickets.map((ticket) => (
                <li key={ticket.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <LinkCell href={`/dashboard/support/${ticket.id}`}>{ticket.subject}</LinkCell>
                    <p className="text-xs text-muted-foreground">
                      {ticket.reference} · {ticket.client.companyName ?? "Client"} ·{" "}
                      {relativeTime(ticket.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="CheckCircle2" title="No open tickets" description="Everything has been answered." />
          )}
        </Panel>
      </div>
    </>
  );
}

async function ClientOverview({
  clientProfileId,
  name,
}: {
  clientProfileId: string | null;
  name: string;
}) {
  if (!clientProfileId) {
    return (
      <>
        <DashboardHeader title={`Welcome, ${name.split(" ")[0]}`} />
        <EmptyState
          icon="UserPlus"
          title="Your client profile is being set up"
          description="Once our team links your account to a company profile, your projects and invoices will appear here."
          action={{ label: "Complete your profile", href: "/dashboard/profile" }}
        />
      </>
    );
  }

  const data = await clientOverview(clientProfileId);

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        description="Your projects, invoices and conversations with the team."
        actions={
          <>
            <ButtonLink href="/dashboard/messages" variant="outline" size="sm">
              Message the team
            </ButtonLink>
            <ButtonLink href="/dashboard/my-invoices" size="sm">
              View invoices
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={data.projectCount} icon="FolderKanban" href="/dashboard/my-projects" />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(data.outstanding)}
          icon="Wallet"
          tone={data.outstanding > 0 ? "warning" : "success"}
          href="/dashboard/my-invoices"
        />
        <StatCard label="Invoices" value={data.invoiceCount} icon="FileText" href="/dashboard/my-invoices" />
        <StatCard label="Open tickets" value={data.openTickets} icon="LifeBuoy" tone="info" href="/dashboard/support" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel
          title="Your projects"
          action={
            <Link href="/dashboard/my-projects" className="text-sm font-medium text-primary hover:underline">
              All projects
            </Link>
          }
        >
          {data.recentProjects.length ? (
            <ul className="space-y-4">
              {data.recentProjects.map((project) => (
                <li key={project.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <LinkCell href={`/dashboard/my-projects/${project.id}`}>{project.name}</LinkCell>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="brand-gradient h-full rounded-full" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {project.progress}% complete
                    {project.dueDate ? ` · due ${formatDate(project.dueDate)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="FolderKanban" title="No projects yet" description="Your active work will appear here." />
          )}
        </Panel>

        <Panel
          title="Recent invoices"
          action={
            <Link href="/dashboard/my-invoices" className="text-sm font-medium text-primary hover:underline">
              All invoices
            </Link>
          }
        >
          {data.recentInvoices.length ? (
            <TableWrap className="border-0">
              <Table className="min-w-[28rem]">
                <thead>
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Due</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map((invoice) => (
                    <Tr key={invoice.id}>
                      <Td>
                        <LinkCell href={`/dashboard/my-invoices/${invoice.id}`}>{invoice.number}</LinkCell>
                      </Td>
                      <Td className="text-muted-foreground">{formatDate(invoice.dueDate)}</Td>
                      <Td className="font-medium">{formatCurrency(Number(invoice.total), invoice.currency)}</Td>
                      <Td>
                        <StatusBadge status={invoice.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState icon="FileText" title="No invoices yet" />
          )}
        </Panel>
      </div>
    </>
  );
}
