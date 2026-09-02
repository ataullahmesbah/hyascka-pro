import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/table";
import { IconBadge } from "@/components/ui/icon";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyServicesPage() {
  const { clientId } = await requireClient();

  const [projects, requests] = await Promise.all([
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
  ]);

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
          <ButtonLink href="/services" variant="outline" size="sm" target="_blank">
            Browse all services
          </ButtonLink>
        }
      />

      <Panel title="Active services" className="mb-5">
        {services.size ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...services.values()].map((service) => (
              <div key={service.slug} className="rounded-lg border border-border p-5">
                <IconBadge name={service.icon} />
                <p className="mt-4 font-display text-base font-semibold">{service.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{service.tagline}</p>
                <p className="mt-3 text-xs text-muted-foreground">
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

      <Panel title="Service requests">
        {requests.length ? (
          <ul className="divide-y divide-border">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{request.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.reference} · {request.service?.title ?? "General"} ·{" "}
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No open requests. Message the team or use the contact form to start something new.
          </p>
        )}
      </Panel>
    </>
  );
}
