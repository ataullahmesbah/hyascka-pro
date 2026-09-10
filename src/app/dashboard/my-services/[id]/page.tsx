import { notFound } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { CancelRequestForm } from "@/components/dashboard/cancel-request-form";
import { RequestThread } from "@/components/dashboard/request-thread";
import { TicketForm } from "@/components/dashboard/ticket-forms";
import { QuoteDecision } from "@/components/dashboard/quote-forms";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { readAttachments } from "@/lib/attachments";
import { requireClient } from "@/lib/client-guard";
import { prisma } from "@/lib/db";
import { toThreadEntries } from "@/lib/request-thread";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COPY: Record<string, string> = {
  SUBMITTED: "We have your request and will come back to you shortly.",
  IN_REVIEW: "We are reading through it now.",
  OFFER_SENT: "We have sent you an offer — see the conversation below.",
  ACCEPTED: "Accepted. Work starts next.",
  IN_PROGRESS: "We are working on it.",
  DELIVERED: "Delivered. Tell us below if anything needs another pass.",
  CONVERTED: "This is now a project — see Projects for the detail.",
  REJECTED: "We were not able to take this on.",
  CLOSED: "Complete and signed off. Thank you — open a new request any time.",
  CANCELLED: "This request has been cancelled.",
};

export default async function MyServiceRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clientId } = await requireClient();
  const { id } = await params;

  const request = await prisma.serviceRequest.findFirst({
    // Scoped by clientId, so another client's request is simply not found.
    where: { id, clientId },
    include: {
      service: { select: { title: true } },
      updates: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
    },
  });
  if (!request) notFound();

  // Only what this request was billed for. A client asking "what did I pay for
  // this?" should not be shown their other invoices.
  const invoices = await prisma.invoice.findMany({
    where: { clientId, requestId: request.id, status: { not: "DRAFT" } },
    orderBy: { issueDate: "desc" },
    select: {
      id: true,
      number: true,
      total: true,
      amountPaid: true,
      currency: true,
      status: true,
      dueDate: true,
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          method: true,
          trxId: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          rejectionReason: true,
        },
      },
    },
  });

  const brief = readAttachments(request.attachments);
  const closed = Boolean(request.closedAt);

  /*
   * Cancelling is only for the window before we confirm the order. Once the
   * work is under way — let alone delivered — it is not something to undo from
   * a portal, so the panel goes away entirely rather than offering a button
   * that would be refused.
   */
  const cancellable =
    !closed &&
    !request.confirmedAt &&
    !["CONVERTED", "IN_PROGRESS", "DELIVERED", "CLOSED", "CANCELLED", "REJECTED"].includes(
      request.status,
    );

  return (
    <>
      <DashboardHeader
        title={request.title}
        description={`${request.reference} · ${request.service?.title ?? "Custom work"}`}
        breadcrumbs={[
          { label: "My services", href: "/dashboard/my-services" },
          { label: request.reference },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-5">
          <Panel title="Where this stands">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={request.status} />
              <span className="text-step--1 text-ink-soft">
                {STATUS_COPY[request.status] ?? "In progress."}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-step--2 text-ink-muted">
                <span>Progress</span>
                <span className="tabular">{request.progress}%</span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-pill bg-surface-2"
                role="progressbar"
                aria-valuenow={request.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress on this request"
              >
                <div
                  className="h-full rounded-pill bg-accent transition-all"
                  style={{ width: `${request.progress}%` }}
                />
              </div>
            </div>
          </Panel>

          <Panel title="What you asked for">
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

          <Panel
            title="Conversation"
            description={
              closed
                ? "This work is closed, so the conversation is now a record of it."
                : "Ask a question, send a file, or tell us something changed."
            }
          >
            <RequestThread
              requestId={request.id}
              entries={toThreadEntries(request.updates, false)}
              placeholder="Write to the team…"
              readOnly={closed}
              readOnlyNote="This work is complete and closed. Start a new request if you need something else."
            />
          </Panel>
        </div>

        <aside className="space-y-5">
          {request.quotedAmount && request.quotedAt ? (
            <Panel title="Our price" description="Accept it and we will get started.">
              <QuoteDecision
                requestId={request.id}
                amount={Number(request.quotedAmount)}
                currency={request.quoteCurrency}
                note={request.quoteNote}
                acceptedAt={request.acceptedAt ? request.acceptedAt.toISOString() : null}
                declinedAt={request.declinedAt ? request.declinedAt.toISOString() : null}
              />
            </Panel>
          ) : null}

          {invoices.length ? (
            <Panel title="Payment" description="What this work was billed, and what you have paid.">
              <ul className="space-y-3">
                {invoices.map((invoice) => {
                  const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
                  return (
                    <li key={invoice.id} className="rounded-lg border border-line p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-step--1 font-medium">{invoice.number}</span>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <p className="mt-1 text-step--1 text-ink-soft">
                        {formatCurrency(Number(invoice.total), invoice.currency)}
                        {invoice.dueDate ? ` · due ${formatDate(invoice.dueDate)}` : ""}
                      </p>

                      {invoice.payments.length ? (
                        <ul className="mt-3 space-y-2 border-t border-line pt-3">
                          {invoice.payments.map((payment) => (
                            <li key={payment.id}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-step--2 font-medium">
                                  {formatCurrency(Number(payment.amount), payment.currency)}
                                </span>
                                <span className="text-step--2 text-ink-muted">
                                  {payment.method.replace(/_/g, " ")}
                                </span>
                                <StatusBadge status={payment.status} />
                              </div>
                              <p className="text-step--2 text-ink-muted">
                                TrxID {payment.trxId ?? "—"} · {formatDate(payment.createdAt, true)}
                              </p>
                              {payment.rejectionReason ? (
                                <p className="text-step--2 text-danger">{payment.rejectionReason}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {outstanding > 0 && !["VOID", "PAID"].includes(invoice.status) ? (
                        <ButtonLink
                          href={`/dashboard/my-invoices/${invoice.id}`}
                          size="sm"
                          className="mt-3 w-full justify-center"
                        >
                          Pay {formatCurrency(outstanding, invoice.currency)}
                        </ButtonLink>
                      ) : (
                        <ButtonLink
                          href={`/dashboard/my-invoices/${invoice.id}`}
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full justify-center"
                        >
                          View invoice
                        </ButtonLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}

          {closed ? null : (
            <Panel
              title="Something wrong?"
              description="Raise a ticket and it arrives already attached to this piece of work."
            >
              <TicketForm requestId={request.id} requestTitle={request.title} />
            </Panel>
          )}

          {cancellable ? (
            <Panel title="Need to stop this?">
              <CancelRequestForm requestId={request.id} />
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}
