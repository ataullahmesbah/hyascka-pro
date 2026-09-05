import Link from "next/link";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { ClientRequestForm } from "@/components/dashboard/client-request-form";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/table";
import { IconBadge } from "@/components/ui/icon";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyServicesPage() {
  const { clientId } = await requireClient();

  const [projects, requests, catalogue] = await Promise.all([
    prisma.project.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { service: { select: { title: true, slug: true, icon: true, tagline: true } } },
    }),
    prisma.serviceRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { service: { select: { title: true } } },
    }),
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  // Custom work gets its own section: it is the part a client cannot look up
  // on the services page, so it needs to be legible on its own.
  const catalogueRequests = requests.filter((request) => !request.isCustom);
  const customRequests = requests.filter((request) => request.isCustom);

  const services = new Map<
    string,
    { title: string; slug: string; icon: string | null; tagline: string | null; count: number }
  >();
  for (const project of projects) {
    if (!project.service) continue;
    const existing = services.get(project.service.slug);
    services.set(project.service.slug, {
      title: project.service.title,
      slug: project.service.slug,
      icon: project.service.icon,
      tagline: project.service.tagline,
      count: (existing?.count ?? 0) + 1,
    });
  }

  return (
    <>
      <DashboardHeader
        title="My services"
        description="What we are delivering for you, and anything you have requested."
        actions={
          <>
            <ButtonLink href="/services" variant="outline" size="sm" target="_blank">
              Browse all services
            </ButtonLink>
            <ClientRequestForm services={catalogue} />
          </>
        }
      />

      <Panel title="Active services" className="mb-5">
        {services.size ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...services.values()].map((service) => (
              <div key={service.slug} className="rounded-lg border border-line p-5">
                <IconBadge name={service.icon} />
                <p className="mt-4 font-display text-base font-semibold">{service.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{service.tagline}</p>
                <p className="mt-3 text-xs text-ink-muted">
                  {service.count} {service.count === 1 ? "engagement" : "engagements"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="Layers"
            title="No active services yet"
            description="Once a project starts, the service behind it appears here."
            action={{ label: "Browse services", href: "/services" }}
          />
        )}
      </Panel>

      <Panel title="Service requests" className="mb-5">
        {catalogueRequests.length ? (
          <RequestList requests={catalogueRequests} />
        ) : (
          <p className="text-sm text-ink-muted">
            Nothing open right now. Use “Request a service” above to start something.
          </p>
        )}
      </Panel>

      <Panel
        title="Custom work"
        description="Work you described to us rather than picking from the catalogue."
      >
        {customRequests.length ? (
          <RequestList requests={customRequests} />
        ) : (
          <p className="text-sm text-ink-muted">
            Nothing custom yet. Choose “Something else — custom work” when you request a service.
          </p>
        )}
      </Panel>
    </>
  );
}

type RequestRow = {
  id: string;
  reference: string;
  title: string;
  status: string;
  progress: number;
  createdAt: Date;
  quotedAmount: unknown;
  quoteCurrency: string;
  acceptedAt: Date | null;
  service: { title: string } | null;
};

/** One line per request, with the bit the client actually looks for: the price. */
function RequestList({ requests }: { requests: RequestRow[] }) {
  return (
    <ul className="divide-y divide-line">
      {requests.map((request) => (
        <li key={request.id} className="py-3 first:pt-0 last:pb-0">
          <Link
            href={`/dashboard/my-services/${request.id}`}
            className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{request.title}</p>
              <p className="text-xs text-ink-muted">
                {request.reference} · {request.service?.title ?? "Custom"} ·{" "}
                {formatDate(request.createdAt)} · {request.progress}% complete
              </p>
            </div>
            {request.quotedAmount ? (
              <span
                className={
                  request.acceptedAt
                    ? "text-sm font-semibold tabular text-ink"
                    : "text-sm font-semibold tabular text-accent"
                }
              >
                {formatCurrency(Number(request.quotedAmount), request.quoteCurrency)}
                {request.acceptedAt ? "" : " — awaiting you"}
              </span>
            ) : null}
            <StatusBadge status={request.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
