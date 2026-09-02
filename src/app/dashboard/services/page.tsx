import { DashboardHeader } from "@/components/dashboard/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  const user = await requirePermission("services.read");
  const editable = can(toActor(user), "services.manage");

  const services = await prisma.service.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      featured: true,
      pricingModel: true,
      startingPrice: true,
      currency: true,
      category: { select: { name: true } },
      _count: { select: { leads: true } },
    },
  });

  return (
    <>
      <DashboardHeader
        title="Services"
        description="The public catalogue. Changes publish to the website within seconds."
        actions={editable ? <ButtonLink href="/dashboard/services/new" size="sm">New service</ButtonLink> : null}
      />

      {services.length ? (
        <TableWrap>
          <Table className="min-w-[52rem]">
            <thead>
              <tr>
                <Th>Service</Th>
                <Th>Category</Th>
                <Th>Pricing</Th>
                <Th>Starts at</Th>
                <Th>Enquiries</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <Tr key={service.id}>
                  <Td>
                    {editable ? (
                      <LinkCell href={`/dashboard/services/${service.id}`}>{service.title}</LinkCell>
                    ) : (
                      <span className="font-medium">{service.title}</span>
                    )}
                    <p className="text-xs text-muted-foreground">/services/{service.slug}</p>
                  </Td>
                  <Td className="text-muted-foreground">{service.category?.name ?? "—"}</Td>
                  <Td className="text-muted-foreground">
                    {service.pricingModel.replace(/_/g, " ").toLowerCase()}
                  </Td>
                  <Td className="font-medium">
                    {service.startingPrice
                      ? formatCurrency(Number(service.startingPrice), service.currency)
                      : "Custom"}
                  </Td>
                  <Td className="text-muted-foreground">{service._count.leads}</Td>
                  <Td className="space-x-1.5">
                    <StatusBadge status={service.status} />
                    {service.featured ? <StatusBadge status="Featured" /> : null}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      ) : (
        <EmptyState
          icon="Layers"
          title="No services yet"
          description="Add your first service to populate the public catalogue."
          action={{ label: "Add a service", href: "/dashboard/services/new" }}
        />
      )}
    </>
  );
}
