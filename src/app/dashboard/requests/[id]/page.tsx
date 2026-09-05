import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { RequestStatusForm } from "@/components/dashboard/request-status-form";
import { RequestThread } from "@/components/dashboard/request-thread";
import { QuoteForm, RequestFinanceActions } from "@/components/dashboard/quote-forms";
import { StatusBadge } from "@/components/ui/badge";
import { readAttachments } from "@/lib/attachments";
import { requireAnyPermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { toThreadEntries } from "@/lib/request-thread";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAnyPermission(["clients.manage", "projects.manage"]);
  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      client: { select: { companyName: true, user: { select: { name: true, email: true } } } },
      service: { select: { title: true } },
      updates: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, subject: true, status: true },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          amountPaid: true,
          currency: true,
          payments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              reference: true,
              method: true,
              trxId: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
  if (!request) notFound();

  const brief = readAttachments(request.attachments);

  return (
    <>
      <DashboardHeader
        title={request.title}
        description={`${request.reference} · ${request.client.companyName ?? request.client.user?.name ?? "Client"}`}
        breadcrumbs={[
          { label: "Requests", href: "/dashboard/requests" },
          { label: request.reference },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-5">
          <Panel title="Brief">
            <p className="whitespace-pre-wrap text-step--1 leading-relaxed text-ink-soft">
              {request.brief}
            </p>
            {brief.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {brief.map((file) => (
                  <a
                    key={file.url}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-btn border border-line bg-surface-2 px-2.5 py-1.5 text-step--2 text-ink-soft hover:text-ink"
                  >
                    {file.name}
                  </a>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="Conversation" description="The client sees everything here except internal notes.">
            <RequestThread
              requestId={request.id}
              entries={toThreadEntries(request.updates, true)}
              canPostInternal
              placeholder="Reply to the client, ask for what you need, or attach a document…"
            />
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel
            title="Price"
            description="What we are charging, and where the client stands on it."
          >
            <QuoteForm
              requestId={request.id}
              amount={request.quotedAmount ? Number(request.quotedAmount) : null}
              currency={request.quoteCurrency}
              note={request.quoteNote}
            />

            {request.quotedAt ? (
              <p className="mt-4 border-t border-line pt-3 text-step--2 text-ink-muted">
                Quoted {formatDate(request.quotedAt, true)}
                {request.acceptedAt
                  ? ` · accepted ${formatDate(request.acceptedAt, true)}`
                  : request.declinedAt
                    ? ` · declined ${formatDate(request.declinedAt, true)}`
                    : " · awaiting the client's answer"}
                {request.confirmedAt ? ` · confirmed ${formatDate(request.confirmedAt)}` : ""}
              </p>
            ) : null}

            <div className="mt-4">
              <RequestFinanceActions
                requestId={request.id}
                accepted={Boolean(request.acceptedAt)}
                confirmed={Boolean(request.confirmedAt)}
                invoiced={request.invoices.length > 0}
              />
            </div>
          </Panel>

          {request.invoices.length ? (
            <Panel title="Billing">
              <ul className="space-y-3">
                {request.invoices.map((invoice) => (
                  <li key={invoice.id} className="rounded-lg border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/dashboard/finance/invoices/${invoice.id}`}
                        className="text-step--1 font-medium text-accent hover:underline"
                      >
                        {invoice.number}
                      </Link>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="mt-1 text-step--2 text-ink-muted">
                      {formatCurrency(Number(invoice.total), invoice.currency)} ·{" "}
                      {formatCurrency(Number(invoice.amountPaid), invoice.currency)} paid
                    </p>
                    {invoice.payments.length ? (
                      <ul className="mt-2 space-y-1 border-t border-line pt-2">
                        {invoice.payments.map((payment) => (
                          <li key={payment.id} className="flex flex-wrap items-center gap-2 text-step--2">
                            <span className="text-ink-soft">
                              {formatCurrency(Number(payment.amount), payment.currency)}
                            </span>
                            <span className="text-ink-muted">{payment.method.replace(/_/g, " ")}</span>
                            <span className="font-mono text-ink-muted">{payment.trxId ?? "—"}</span>
                            <StatusBadge status={payment.status} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-step--2 text-ink-muted">No payment submitted yet.</p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Status">
            <RequestStatusForm
              requestId={request.id}
              status={request.status}
              progress={request.progress}
            />
          </Panel>

          <Panel title="Details">
            <dl className="space-y-3 text-step--1">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Current</dt>
                <dd><StatusBadge status={request.status} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Progress</dt>
                <dd className="tabular">{request.progress}%</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Service</dt>
                <dd>{request.service?.title ?? "Custom"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Budget</dt>
                <dd>{request.budget ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Raised</dt>
                <dd>{formatDate(request.createdAt)}</dd>
              </div>
            </dl>
          </Panel>

          {request.tickets.length ? (
            <Panel title={`Tickets about this (${request.tickets.length})`}>
              <ul className="space-y-2">
                {request.tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/dashboard/support/${ticket.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-step--1 transition-colors hover:border-accent-border hover:bg-surface-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{ticket.subject}</span>
                        <span className="text-step--2 text-ink-muted">{ticket.reference}</span>
                      </span>
                      <StatusBadge status={ticket.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {request.cancelRequestedAt && !request.cancelledAt ? (
            <Panel title="Cancellation requested">
              <p className="text-step--1 text-ink-soft">{request.cancelReason}</p>
              <p className="mt-2 text-step--2 text-ink-muted">
                Asked on {formatDate(request.cancelRequestedAt, true)}. Set the status to Cancelled
                above to accept it, or reply in the thread to negotiate.
              </p>
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}
