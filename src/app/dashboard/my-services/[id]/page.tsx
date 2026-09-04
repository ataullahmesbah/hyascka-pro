import { notFound } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { CancelRequestForm } from "@/components/dashboard/cancel-request-form";
import { RequestThread } from "@/components/dashboard/request-thread";
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

  const invoices = await prisma.invoice.findMany({
    where: { clientId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
    orderBy: { issuedAt: "desc" },
    select: { id: true, number: true, total: true, currency: true, status: true, dueDate: true },
    take: 3,
  });

  const brief = readAttachments(request.attachments);
  const cancellable = !["CONVERTED", "CANCELLED", "REJECTED"].includes(request.status);

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

          <Panel title="Conversation" description="Ask a question, send a file, or tell us something changed.">
            <RequestThread
              requestId={request.id}
              entries={toThreadEntries(request.updates, false)}
              placeholder="Write to the team…"
            />
          </Panel>
        </div>

        <aside className="space-y-5">
          {invoices.length ? (
            <Panel title="Payment">
              <ul className="space-y-3">
                {invoices.map((invoice) => (
                  <li key={invoice.id} className="rounded-lg border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-step--1 font-medium">{invoice.number}</span>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="mt-1 text-step--1 text-ink-soft">
                      {formatCurrency(Number(invoice.total), invoice.currency)}
                      {invoice.dueDate ? ` · due ${formatDate(invoice.dueDate)}` : ""}
                    </p>
                    <ButtonLink
                      href={`/dashboard/my-invoices/${invoice.id}`}
                      size="sm"
                      className="mt-3 w-full justify-center"
                    >
                      Pay this invoice
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Need to stop this?">
            {request.cancelRequestedAt && !request.cancelledAt ? (
              <p className="text-step--1 text-ink-soft">
                You asked to cancel on {formatDate(request.cancelRequestedAt)}. Someone will come
                back to you in the conversation.
              </p>
            ) : cancellable ? (
              <CancelRequestForm requestId={request.id} />
            ) : (
              <p className="text-step--1 text-ink-soft">
                This request can no longer be cancelled here. Raise a ticket from Support and we
                will sort it out with you.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
